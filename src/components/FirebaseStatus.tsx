import { isFirebaseConfigured } from '@/lib/firebase'

/** Dev helper — remove or hide once env is wired in production. */
export function FirebaseStatus() {
  if (import.meta.env.PROD && isFirebaseConfigured) return null

  return (
    <div
      className={`fixed right-3 bottom-3 z-50 max-w-xs rounded-xl border px-3 py-2 text-xs shadow-soft ${
        isFirebaseConfigured
          ? 'border-sage/30 bg-surface text-sage'
          : 'border-gold/40 bg-surface text-gold-deep'
      }`}
    >
      {isFirebaseConfigured
        ? 'Firebase connected'
        : 'Firebase not configured — copy .env.example to .env.local'}
    </div>
  )
}
