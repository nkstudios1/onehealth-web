import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, clearTokens, extractError, saveTokens } from '../lib/api'
import { getStoredUser, saveUser } from '../lib/auth'
import type { LoginResponse, StaffProfile, User } from '../types'

interface AuthContextValue {
  user: User | null
  staffProfile: StaffProfile | null
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: User }>('/auth/me/')
      const u = data.data
      setUser(u)
      saveUser(u)
      // For hospital_staff users, UserSerializer embeds the staff profile
      // as `profile` — no second request needed.
      if (u.user_type === 'hospital_staff' && u.profile) {
        setStaffProfile(u.profile as unknown as StaffProfile)
      }
    } catch {
      // silently ignore — token might just be missing
    }
  }, [])

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      refreshMe()
    }
  }, [refreshMe])

  const login = useCallback(async (identifier: string, password: string) => {
    setIsLoading(true)
    try {
      const { data } = await api.post<{ success: boolean; message: string; data: LoginResponse }>(
        '/auth/login/',
        { identifier, password }
      )
      const { user: u, tokens } = data.data
      saveTokens(tokens.access, tokens.refresh)
      saveUser(u)
      setUser(u)
      // Staff profile is embedded in user.profile by UserSerializer
      if (u.user_type === 'hospital_staff' && u.profile) {
        setStaffProfile(u.profile as unknown as StaffProfile)
      }
    } catch (err) {
      throw new Error(extractError(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token')
    try {
      if (refresh) await api.post('/auth/logout/', { refresh })
    } catch {
      // ignore logout errors
    } finally {
      clearTokens()
      setUser(null)
      setStaffProfile(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, staffProfile, isLoading, login, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
