import { useState, useEffect  } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { messageAPI } from '@/services/api'
import { EmptyState, Avatar } from '@/components/common/UI'
import { formatDistanceToNow } from 'date-fns'
import useAuthStore from '@/store/authStore'
import { useSocket } from '@/hooks/index' 
import { useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

export default function JSMessages() {
  const [selected, setSelected] = useState(null);
  const { user } = useAuthStore();
  const socketRef = useSocket();
  const qc = useQueryClient();
  const location = useLocation();

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: () =>
      messageAPI.getConversations().then(r => r.data?.data || []),
  });

  const { data: messagesData = [] } = useQuery({
    queryKey: ['messages', selected?._id],
    queryFn: () =>
      messageAPI.getMessages(selected._id).then(r => r.data?.data || []),
    enabled: !!selected?._id,
  });

  const convos = conversations;
  const messages = messagesData;

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket) return;

    socket.on('new_message', ({ conversationId }) => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => socket.off('new_message');
  }, [qc, socketRef]);

  useEffect(() => {
    if (location.state?.conversationId && convos.length > 0) {
      const target = convos.find(
        c => c._id === location.state.conversationId
      );

      if (target) {
        setSelected(target);
      }
    }
  }, [convos, location.state?.conversationId]);

  return (
    <div className="animate-fade-in">
      <h1 className="page-title mb-6">Messages</h1>
      <div className="card overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-72 border-r border-gray-100 dark:border-dark-700 flex flex-col">
            <div className="p-4 border-b border-gray-100 dark:border-dark-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Conversations</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {convos.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare size={24} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No conversations yet</p>
                </div>
              ) : convos.map(convo => {
                const other = convo.participants?.find(p => p._id !== user?._id)
                return (
                  <button key={convo._id} onClick={() => setSelected(convo)}
                    className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors border-b border-gray-50 dark:border-dark-700/50 ${selected?._id === convo._id ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
                    <Avatar name={`${other?.firstName} ${other?.lastName}`} src={other?.avatar?.secureUrl} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{other?.firstName} {other?.lastName}</p>
                      <p className="text-xs text-gray-400 truncate">{convo.lastMessageText || 'No messages yet'}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState icon={MessageSquare} title="Select a conversation" description="Choose a conversation from the left to start chatting" />
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 dark:border-dark-700">
                  {(() => { const other = selected.participants?.find(p => p._id !== user?._id); return <div className="flex items-center gap-3"><Avatar name={`${other?.firstName} ${other?.lastName}`} src={other?.avatar?.secureUrl} size="sm" /><p className="font-semibold text-sm text-gray-900 dark:text-white">{other?.firstName} {other?.lastName}</p></div> })()}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => {
                    const isMe = msg.sendBy?._id === user?._id || msg.sendBy === user?._id
                    return (
                      <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white'}`}>
                          {msg.message}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <MessageInput conversationId={selected._id} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MessageInput({ conversationId }) {
  const [msg, setMsg] = useState('')
  const send = async () => {
    if (!msg.trim()) return
    try {
      await messageAPI.send(conversationId, { message: msg })
      setMsg('')
    } catch { }
  }
  return (
    <div className="p-4 border-t border-gray-100 dark:border-dark-700 flex gap-3">
      <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
        placeholder="Type a message..." className="input flex-1 h-12 text-sm" />
      <button onClick={send} className="btn-primary px-4 h-12"><Send size={15} /></button>
    </div>
  )
}
