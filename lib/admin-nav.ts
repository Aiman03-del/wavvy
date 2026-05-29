export type AdminSection = 'songs' | 'requests' | 'artists' | 'users' | 'stats'

export const ADMIN_SECTION_ROUTES: Record<AdminSection, string> = {
  songs: '/admin/songs',
  requests: '/admin/requests',
  artists: '/admin/artists',
  users: '/admin/users',
  stats: '/admin/stats',
}

export const ADMIN_NAV_ITEMS: AdminSection[] = [
  'songs',
  'requests',
  'artists',
  'users',
  'stats',
]

export function getAdminSectionFromPathname(pathname: string | null): AdminSection {
  if (!pathname || pathname === '/admin') return 'stats'
  if (pathname.startsWith('/admin/requests')) return 'requests'
  if (pathname.startsWith('/admin/artists')) return 'artists'
  if (pathname.startsWith('/admin/users')) return 'users'
  if (pathname.startsWith('/admin/stats')) return 'stats'
  if (pathname.startsWith('/admin/songs')) return 'songs'
  return 'stats'
}
