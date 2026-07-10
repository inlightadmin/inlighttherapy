import {
  deleteUserAccount,
  fetchUserProfile,
  optInToNewsletter,
  optOutOfChat,
  optOutOfNewsletter,
  optOutOfSms,
  promoteToClient,
  removeUserPhone,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  subscribeAuth,
  updateUserDisplayName,
  updateUserPhone,
  updateUserPhoto,
  type SignupInput,
} from '@/lib/auth'
import { auth, isFirebaseConfigured } from '@/lib/firebase'
import type { UserProfile } from '@/lib/types'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
    displayName?: string
    termsAccepted?: boolean
    privacyAccepted?: boolean
    smsConsent?: boolean
    chatOptIn?: boolean
    newsletterConsent?: boolean
    phoneE164?: string
    requireConsents?: boolean
  }) => Promise<void>
  logOut: () => Promise<void>
  optInChat: () => Promise<void>
  optInSms: (phoneE164: string) => Promise<void>
  optOutChat: () => Promise<void>
  optOutSms: () => Promise<void>
  optInNewsletter: () => Promise<void>
  optOutNewsletter: () => Promise<void>
  updateDisplayName: (displayName: string) => Promise<void>
  updatePhoto: (file: File) => Promise<void>
  updatePhone: (phoneE164: string) => Promise<void>
  removePhone: () => Promise<void>
  deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  /** Bumps so stale onAuthStateChanged profile fetches cannot overwrite a fresh signup write */
  const profileFetchGen = useRef(0)

  const loadProfile = useCallback(async (firebaseUser: User | null) => {
    const gen = ++profileFetchGen.current
    if (!firebaseUser) {
      if (gen === profileFetchGen.current) setProfile(null)
      return
    }
    const data = await fetchUserProfile(firebaseUser.uid)
    if (gen === profileFetchGen.current) {
      setProfile(data)
    }
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

  const applyProfile = useCallback((p: UserProfile) => {
    profileFetchGen.current += 1
    setProfile(p)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      configured: isFirebaseConfigured,
      refreshProfile,
      signUp: async (input) => {
        const p = await signUpWithEmail(input)
        applyProfile(p)
      },
      signIn: async (email, password) => {
        const u = await signInWithEmail(email, password)
        await loadProfile(u)
      },
      signInGoogle: async (options) => {
        const p = await signInWithGoogle(options)
        applyProfile(p)
      },
      logOut: async () => {
        await signOut()
        profileFetchGen.current += 1
        setProfile(null)
      },
      optInChat: async () => {
        if (!user) throw new Error('Not signed in')
        const p = await promoteToClient(user.uid, 'chat')
        applyProfile(p)
      },
      optInSms: async (phoneE164) => {
        if (!user) throw new Error('Not signed in')
        const p = await promoteToClient(user.uid, 'sms', phoneE164)
        applyProfile(p)
      },
      optOutChat: async () => {
        if (!user) throw new Error('Not signed in')
        const p = await optOutOfChat(user.uid)
        applyProfile(p)
      },
      optOutSms: async () => {
        if (!user) throw new Error('Not signed in')
        const p = await optOutOfSms(user.uid)
        applyProfile(p)
      },
      optInNewsletter: async () => {
        if (!user) throw new Error('Not signed in')
        const p = await optInToNewsletter(user.uid)
        applyProfile(p)
      },
      optOutNewsletter: async () => {
        if (!user) throw new Error('Not signed in')
        const p = await optOutOfNewsletter(user.uid)
        applyProfile(p)
      },
      updateDisplayName: async (displayName) => {
        if (!user) throw new Error('Not signed in')
        const p = await updateUserDisplayName(user, displayName)
        setUser(auth?.currentUser ?? user)
        applyProfile(p)
      },
      updatePhoto: async (file) => {
        if (!user) throw new Error('Not signed in')
        const p = await updateUserPhoto(user, file)
        setUser(auth?.currentUser ?? user)
        applyProfile(p)
      },
      updatePhone: async (phoneE164) => {
        if (!user) throw new Error('Not signed in')
        const p = await updateUserPhone(user.uid, phoneE164)
        applyProfile(p)
      },
      removePhone: async () => {
        if (!user) throw new Error('Not signed in')
        const p = await removeUserPhone(user.uid)
        applyProfile(p)
      },
      deleteAccount: async () => {
        if (!user) throw new Error('Not signed in')
        await deleteUserAccount(user)
        profileFetchGen.current += 1
        setProfile(null)
        setUser(null)
      },
    }),
    [user, profile, loading, refreshProfile, loadProfile, applyProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
