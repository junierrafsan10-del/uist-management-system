import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const timeoutRef = useRef(null)

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setProfile(data)
    return data
  }, [])

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      if (loading) setLoading(false)
    }, 5000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        const u = session?.user ?? null
        setUser(u)
        if (u) {
          return fetchProfile(u.id)
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        setInitialized(true)
        clearTimeout(timeoutRef.current)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (u && event !== 'SIGNED_OUT') {
        const p = await fetchProfile(u.id)
        if (!p && u.user_metadata?.role) {
          setProfile({
            id: u.id,
            email: u.email,
            full_name: u.user_metadata.full_name || u.email?.split('@')[0],
            role: u.user_metadata.role || 'student',
          })
        }
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription.unsubscribe()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [fetchProfile, loading])

  const signIn = useCallback(async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }, [])

  const signUp = useCallback(async (email, password, metadata = {}) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    })
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) {
      const p = await fetchProfile(user.id)
      return p
    }
  }, [user, fetchProfile])

  return (
    <AuthContext.Provider value={{ user, profile, loading, initialized, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
