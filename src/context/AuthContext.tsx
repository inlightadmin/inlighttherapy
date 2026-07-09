import {
  fetchUserProfile,
  promoteToClient,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  subscribeAuth,
  type SignupInput,
} from '@/lib/auth'
import { isFirebaseConfigured } from '@/lib/firebase'
import type { UserProfile } from '@/lib/types'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from 'firebase/auth'

type AuthContextValue = {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  configured: boolean
  refreshProfile: () => Promise<void>
  signUp: (input: SignupInput) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInGoogle: (options?: {
    termsAccepted?: boolean
    privacyAccepted?: boolean
    smsConsent?: boolean
    chatOptIn?: boolean
    phoneE164?: string
    requireConsents?: boolean
  }) => Promise<void>
  logOut: () => Promise<void>
  optInChat: () => Promise<void>
  optInSms: (phoneE164: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (firebaseUser: User | null) => {
    if (!firebaseUser) {
      setProfile(null)
      return
    }
    const data = await fetchUserProfile(firebaseUser.uid)
    setProfile(data)
  }, [])

  useEffect(() => {
    const unsub = subscribeAuth(async (firebaseUser) => {
      setUser(firebaseUser)
      try {
        await loadProfile(firebaseUser)
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      return
    }
    await loadProfile(user)
  }, [loadProfile, user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      refreshProfile,
      signUp: async (input) => {
        const p = await signUpWithEmail(input)
        setProfile(p)
      },
      signIn: async (email, password) => {
        const u = await signInWithEmail(email, password)
        await loadProfile(u)
      },
      signInGoogle: async (options) => {
        const p = await signInWithGoogle(options)
        setProfile(p)
      },
      logOut: async () => {
        await signOut()
        setProfile(null)
      },
      optInChat: async () => {
        if (!user) throw new Error('Not signed in')
        const p = await promoteToClient(user.uid, 'chat')
        setProfile(p)
      },
      optInSms: async (phoneE164) => {
        if (!user) throw new Error('Not signed in')
        const p = await promoteToClient(user.uid, 'sms', phoneE164)
        setProfile(p)
      },
    }),
    [user, profile, loading, refreshProfile, loadProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
