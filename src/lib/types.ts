/** Role hierarchy (privilege ascending): USER < CLIENT < CLINICIAN < PUBLICIST < ADMIN */
export type Role = 'USER' | 'CLIENT' | 'CLINICIAN' | 'PUBLICIST' | 'ADMIN'

export const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  CLIENT: 1,
  CLINICIAN: 2,
  PUBLICIST: 3,
  ADMIN: 4,
}

export function hasMinRole(userRole: Role | undefined, min: Role): boolean {
  if (!userRole) return false
  return ROLE_RANK[userRole] >= ROLE_RANK[min]
}

export type WeeklyHours = {
  /** 0 = Sunday … 6 = Saturday */
  day: number
  open: string
  close: string
  closed?: boolean
}[]

export type UserProfile = {
  uid: string
  email: string
  displayName: string
  photoURL?: string
  phoneE164?: string
  role: Role
  smsConsent?: {
    agreed: boolean
    timestamp?: string
    marketing?: boolean
    reminders?: boolean
  }
  chatOptIn?: boolean
  termsAcceptedAt?: string
  privacyAcceptedAt?: string
  createdAt?: string
  updatedAt?: string
}

export type ClinicianProfile = {
  uid: string
  slug: string
  displayName: string
  title?: string
  bio: string
  photoURL?: string
  modalities: string[]
  populations: string[]
  insurance: string[]
  expertise: string[]
  focus: string[]
  services: string[]
  calendlyUrl?: string
  selfAvailability?: WeeklyHours
  overrideAvailability?: WeeklyHours
  published?: boolean
}

export type SiteQuote = {
  id: string
  text: string
  attribution?: string
  active: boolean
  order?: number
}

export type Tool = {
  id: string
  title: string
  summary: string
  body: string
  icon?: string
  order?: number
  published: boolean
}

export type BusinessHours = {
  timezone: string
  weekly: WeeklyHours
  note?: string
}
