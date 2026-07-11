import type { BusinessHours, ClinicianProfile, SiteQuote, Tool } from './types'

export const PRACTICE = {
  name: 'In-Light Therapy',
  tagline: 'Find the light within',
  /** Public practice inbox (Sean). Developer tooling uses inlightadmin@gmail.com. */
  email: 's3an1amb@gmail.com',
  phone: '801-318-3396',
  phoneHref: 'tel:8013183396',
  siteUrl: import.meta.env.VITE_SITE_URL || 'https://in-lighttherapy.web.app',
  location: {
    name: 'In-Light Therapy',
    street: '2230 N University Pkwy',
    suite: 'Ste 9D',
    city: 'Provo',
    state: 'UT',
    zip: '84604',
    fullAddress: '2230 N University Pkwy Ste 9D, Provo, UT 84604',
    mapsUrl: 'https://maps.app.goo.gl/G3S7TEEp1cvE31h16',
    /** Google Maps embed for the Google Business place */
    mapsEmbedSrc:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3044.609419178564!2d-111.6655313!3d40.262210800000005!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x874d9b1d150d3785%3A0x1ae6ad9d6da55a57!2sin-light%20therapy!5e0!3m2!1sen!2sus!4v1783643311785!5m2!1sen!2sus',
    notes: [
      'Lots of parking available',
      'Wheelchair accessible',
      'Entrance on the 2nd floor',
    ],
  },
}

export const CRISIS_DISCLAIMER_SHORT =
  'This website is not crisis support. If you are in immediate danger, call 911. For 24/7 support in the US, call or text 988.'

export const CRISIS_DISCLAIMER_FULL = `This website is not crisis support and is not a substitute for emergency care or professional treatment.

If you are in immediate danger or thinking about harming yourself or others, call 911 (US) or go to the nearest emergency room.

For 24/7 emotional support in the US, call or text 988 (Suicide & Crisis Lifeline).

Online chat on this site is for general questions and scheduling only. It is not therapy, diagnosis, or clinical care, and messages should not include private health information.`

export const PLACEHOLDER_HOURS: BusinessHours = {
  timezone: 'America/Denver',
  note: 'Hours shown for general guidance. Book a session to confirm availability.',
  weekly: [
    { day: 0, open: '', close: '', closed: true },
    { day: 1, open: '09:00', close: '17:00' },
    { day: 2, open: '09:00', close: '17:00' },
    { day: 3, open: '09:00', close: '17:00' },
    { day: 4, open: '09:00', close: '17:00' },
    { day: 5, open: '09:00', close: '15:00' },
    { day: 6, open: '', close: '', closed: true },
  ],
}

export const PLACEHOLDER_QUOTES: SiteQuote[] = [
  {
    id: 'q1',
    text: 'Healing is not about becoming someone new. It is about gently returning to yourself.',
    attribution: 'In-Light Therapy',
    active: true,
    order: 1,
  },
  {
    id: 'q2',
    text: 'You do not have to carry everything alone. Support can be soft, steady, and real.',
    attribution: 'In-Light Therapy',
    active: true,
    order: 2,
  },
]

export const PLACEHOLDER_CLINICIANS: ClinicianProfile[] = [
  {
    uid: 'sample-clinician',
    slug: 'sample-clinician',
    displayName: 'Alex Rivera, LCSW',
    title: 'Licensed Clinical Social Worker',
    bio: 'Alex offers a warm, collaborative space for people navigating anxiety, trauma, and relationship stress. Sessions blend practical skills with compassionate curiosity so change feels possible—and sustainable.',
    photoURL: undefined,
    modalities: ['CBT', 'Trauma-informed care', 'Mindfulness-based approaches'],
    populations: ['Adults', 'Teens 16+', 'Couples'],
    insurance: ['Private pay', 'Superbill available', 'Select PPO plans'],
    expertise: ['Anxiety', 'Trauma recovery', 'Life transitions'],
    focus: ['Whole-person care', 'Skills you can use between sessions'],
    services: ['Individual therapy', 'Couples therapy', 'Family consultation'],
    calendlyUrl: 'https://calendly.com/',
    published: true,
    selfAvailability: PLACEHOLDER_HOURS.weekly,
  },
]

export const PLACEHOLDER_TOOLS: Tool[] = [
  {
    id: 'grounding-5-4-3-2-1',
    title: '5-4-3-2-1 Grounding',
    summary: 'A simple sensory reset when anxiety spikes.',
    body: `Use this when your mind races or your body feels flooded.

1. Name **5** things you can see.
2. Name **4** things you can touch.
3. Name **3** things you can hear.
4. Name **2** things you can smell.
5. Name **1** thing you can taste (or one slow breath).

Move slowly. There is no perfect answer—only returning to the present moment.`,
    order: 1,
    published: true,
  },
  {
    id: 'box-breathing',
    title: 'Box Breathing',
    summary: 'Steady your nervous system with equal counts of breath.',
    body: `Inhale for 4. Hold for 4. Exhale for 4. Hold for 4. Repeat 4 cycles.

If 4 feels long, try 3. If you feel dizzy, return to natural breathing.

This tool is supportive, not medical treatment.`,
    order: 2,
    published: true,
  },
  {
    id: 'values-compass',
    title: 'Values Compass',
    summary: 'Reconnect with what matters when decisions feel heavy.',
    body: `Write three values that matter this season (for example: connection, rest, honesty).

For each value, note one tiny action you could take this week.

Values are a compass—not a scorecard.`,
    order: 3,
    published: true,
  },
]

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]
