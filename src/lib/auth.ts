import type { User } from '../types'

export function saveUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user))
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return !!localStorage.getItem('access_token')
}
