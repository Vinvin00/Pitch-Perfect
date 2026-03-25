export type MagicBentoPitchCard =
  | {
      id: string
      variant: 'career'
      label: string
      hero: string
      lead: string
      bullets: { num: string; text: string }[]
      pill: string
    }
  | {
      id: string
      variant: 'memory'
      label: string
      hero: string
      lead: string
      subHero: { num: string; rest: string }
      pill: string
    }
  | {
      id: string
      variant: 'impression'
      label: string
      heroNum: string
      heroUnit: string
      lead: string
      pill: string
    }
  | {
      id: string
      variant: 'mehrabian'
      label: string
      pill: string
    }
  | {
      id: string
      variant: 'business'
      label: string
      hero: string
      lead: string
      subHero: { num: string; rest: string }
      pill: string
    }

export const PITCH_COACH_BENTO_CARDS: MagicBentoPitchCard[] = [
  {
    id: 'career',
    variant: 'career',
    label: 'Career impact',
    hero: '76%',
    lead: 'of execs say presentation skills drive career growth — not just qualifications.',
    bullets: [
      { num: '60%', text: 'of employers call it a must-have' },
      { num: '59%', text: 'of hiring managers judge delivery' },
      { num: '10%', text: 'salary bump from speaking training' },
      { num: '45%', text: 'dodge promotions over stage fright' },
    ],
    pill: 'Hired faster · promoted sooner · paid more',
  },
  {
    id: 'memory',
    variant: 'memory',
    label: 'Memory & recall',
    hero: '95%',
    lead: 'retained with strong delivery and storytelling.',
    subHero: { num: '10%', rest: 'from text alone' },
    pill: '9× more memorable',
  },
  {
    id: 'impression',
    variant: 'impression',
    label: 'First impressions',
    heroNum: '27',
    heroUnit: 'seconds',
    lead: 'to make a lasting impression — before you say a word.',
    pill: 'Delivery is decided in seconds',
  },
  {
    id: 'mehrabian',
    variant: 'mehrabian',
    label: 'What audiences actually process',
    pill: 'Delivery beats the script',
  },
  {
    id: 'business',
    variant: 'business',
    label: 'Business outcomes',
    hero: '67%',
    lead: 'more likely to close funding with confident delivery.',
    subHero: { num: '24–44%', rest: 'better decisions when communicated clearly' },
    pill: 'Clear story · clear choices · more wins',
  },
]
