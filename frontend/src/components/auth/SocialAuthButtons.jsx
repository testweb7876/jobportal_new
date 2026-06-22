import { oauthURLs } from '@/services/api'

export default function SocialAuthButtons() {
  return (
    <>
      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-gray-200 dark:bg-dark-600" />
        <span className="text-xs font-medium text-gray-400 tracking-wide">OR CONTINUE WITH</span>
        <div className="h-px flex-1 bg-gray-200 dark:bg-dark-600" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href={oauthURLs.google}
          className="btn-secondary justify-center py-2.5 text-sm flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"/>
            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"/>
            <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"/>
          </svg>
          Google
        </a>
        <a
          href={oauthURLs.linkedin}
          className="btn-secondary justify-center py-2.5 text-sm flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.33V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z"/>
          </svg>
          LinkedIn
        </a>
      </div>
    </>
  )
}