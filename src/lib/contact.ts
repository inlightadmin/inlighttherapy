import { httpsCallable } from 'firebase/functions'
import { functions, isFirebaseConfigured } from './firebase'

export type ContactFormInput = {
  name: string
  email: string
  message: string
}

/**
 * Submit contact form via Cloud Function → SendGrid → practice inbox.
 */
export async function sendContactMessage(
  input: ContactFormInput,
): Promise<void> {
  if (!isFirebaseConfigured || !functions) {
    throw new Error('Firebase is not configured.')
  }

  const callable = httpsCallable(functions, 'sendContactEmail')
  await callable({
    name: input.name.trim(),
    email: input.email.trim(),
    message: input.message.trim(),
  })
}

export function mapContactError(err: unknown): string {
  if (typeof err === 'object' && err && 'code' in err) {
    const code = String((err as { code: string }).code)
    const message =
      'message' in err ? String((err as { message: string }).message) : ''

    if (code === 'functions/invalid-argument') {
      return message.replace(/^Firebase:\s*/i, '').replace(/\s*\(.*\)$/, '') ||
        'Please check your name, email, and message.'
    }
    if (code === 'functions/failed-precondition') {
      return 'Email is temporarily unavailable. Please email us directly.'
    }
    if (code === 'functions/internal') {
      return (
        message.replace(/^Firebase:\s*/i, '').replace(/\s*\(.*\)$/, '') ||
        'Could not send your message. Please try again or email us directly.'
      )
    }
    if (code === 'functions/unavailable') {
      return 'Service temporarily unavailable. Please try again in a moment.'
    }
  }
  if (err instanceof Error && err.message) return err.message
  return 'Could not send your message. Please try again or email us directly.'
}
