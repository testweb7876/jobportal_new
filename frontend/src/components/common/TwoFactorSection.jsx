import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { ShieldCheck, ShieldOff } from 'lucide-react'
import { twoFactorAPI } from '@/services/api'
import { Modal } from '@/components/common/UI'
import useAuthStore from '@/store/authStore'
import toast from 'react-hot-toast'

export default function TwoFactorSection() {
  const { user, updateUser } = useAuthStore()
  const [setupModal, setSetupModal] = useState(false)
  const [disableModal, setDisableModal] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [manualKey, setManualKey] = useState(null)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')

  const setupMutation = useMutation({
    mutationFn: () => twoFactorAPI.setup(),
    onSuccess: (res) => {
      setQrCode(res.data.qrCode)
      setManualKey(res.data.manualEntryKey)
      setSetupModal(true)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to start 2FA setup'),
  })

  const verifyMutation = useMutation({
    mutationFn: () => twoFactorAPI.verifyEnable({ token: code }),
    onSuccess: () => {
      toast.success('Two-factor authentication enabled!')
      updateUser({ twoFactorEnabled: true })
      setSetupModal(false)
      setCode('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Invalid code'),
  })

  const disableMutation = useMutation({
    mutationFn: () => twoFactorAPI.disable({ password }),
    onSuccess: () => {
      toast.success('Two-factor authentication disabled')
      updateUser({ twoFactorEnabled: false })
      setDisableModal(false)
      setPassword('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Incorrect password'),
  })

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <ShieldCheck size={16} className="text-primary-600" />
        </div>
        <h2 className="font-display font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Add an extra layer of security to your account using an authenticator app.
      </p>

      {user?.twoFactorEnabled ? (
        <button onClick={() => setDisableModal(true)} className="btn-danger btn-sm">
          <ShieldOff size={14} /> Disable 2FA
        </button>
      ) : (
        <button onClick={() => setupMutation.mutate()} disabled={setupMutation.isPending} className="btn-primary btn-sm">
          {setupMutation.isPending ? 'Loading...' : 'Enable 2FA'}
        </button>
      )}

      {/* Setup Modal */}
      <Modal open={setupModal} onClose={() => { setSetupModal(false); setCode('') }} title="Enable Two-Factor Authentication">
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Scan this QR code with Google Authenticator, Authy, or a similar app.
          </p>
          {qrCode && <img src={qrCode} alt="2FA QR Code" className="mx-auto rounded-xl border border-gray-200 dark:border-dark-700" />}
          {manualKey && (
            <p className="text-xs text-gray-400 font-mono break-all">
              Manual entry key: {manualKey}
            </p>
          )}
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength={6}
            className="input text-center text-xl tracking-widest"
          />
          <button
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending || code.length !== 6}
            className="btn-primary w-full justify-center">
            {verifyMutation.isPending ? 'Verifying...' : 'Verify & Enable'}
          </button>
        </div>
      </Modal>

      {/* Disable Modal */}
      <Modal open={disableModal} onClose={() => { setDisableModal(false); setPassword('') }} title="Disable Two-Factor Authentication">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Enter your password to confirm.</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
            className="input"
          />
          <div className="flex gap-3">
            <button onClick={() => setDisableModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => disableMutation.mutate()}
              disabled={disableMutation.isPending || !password}
              className="btn-danger flex-1">
              {disableMutation.isPending ? 'Disabling...' : 'Disable 2FA'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}