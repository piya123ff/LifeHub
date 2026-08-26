export const MENU_ITEMS = [
  {
    path:   '/dashboard',
    label:  'Dashboard',
    accent: 'violet',
    icon: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>`,
  },
  {
    path:   '/finance',
    label:  'การเงิน',
    accent: 'green',
    icon: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <line x1="2" y1="10" x2="22" y2="10"/>
      <line x1="6" y1="15" x2="10" y2="15"/>
    </svg>`,
  },
  {
    path:   '/todo',
    label:  'To-Do',
    accent: 'blue',
    icon: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>`,
  },
  {
    path:   '/workout',
    label:  'Workout',
    accent: 'orange',
    icon: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M6.5 6.5h11M4 10.5h2M18 10.5h2M4 13.5h2M18 13.5h2"/>
      <rect x="2" y="9" width="2" height="6" rx="1"/>
      <rect x="20" y="9" width="2" height="6" rx="1"/>
      <rect x="6" y="5" width="2" height="14" rx="1"/>
      <rect x="16" y="5" width="2" height="14" rx="1"/>
    </svg>`,
  },
  {
    path:   '/health',
    label:  'สุขภาพ',
    accent: 'rose',
    icon: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`,
  },
  {
    path:   '/goals',
    label:  'เป้าหมาย',
    accent: 'teal',
    icon: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>`,
  },
  {
    path:   '/habits',
    label:  'Habits',
    accent: 'amber',
    icon: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
      <path d="M8 12l3 3 5-5"/>
    </svg>`,
  },
  {
    path:   '/backup',
    label:  'Backup',
    accent: 'blue',
    icon: `<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>`,
  },
]

// Bottom nav: Dashboard, Finance, Todo, Workout, Habits
export const BOTTOM_NAV_ITEMS = [
  MENU_ITEMS[0],
  MENU_ITEMS[1],
  MENU_ITEMS[2],
  MENU_ITEMS[3],
  MENU_ITEMS[6],
]
