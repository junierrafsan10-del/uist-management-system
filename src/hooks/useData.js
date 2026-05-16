import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

function getGrade(marks) {
  if (marks >= 90) return { grade: 'A+', points: 10 }
  if (marks >= 80) return { grade: 'A', points: 9 }
  if (marks >= 70) return { grade: 'B', points: 8 }
  if (marks >= 60) return { grade: 'C', points: 7 }
  if (marks >= 50) return { grade: 'D', points: 6 }
  return { grade: 'F', points: 0 }
}

function getGradeLetter(marks, total) {
  const pct = (marks / total) * 100
  if (pct >= 90) return { grade: 'A+', points: 4.0 }
  if (pct >= 80) return { grade: 'A', points: 4.0 }
  if (pct >= 70) return { grade: 'B', points: 3.0 }
  if (pct >= 60) return { grade: 'C', points: 2.0 }
  if (pct >= 50) return { grade: 'D', points: 1.0 }
  return { grade: 'F', points: 0.0 }
}

export { getGrade, getGradeLetter }

function useSupabaseQuery(table, query = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let q = supabase.from(table).select(query.select || '*')
      if (query.eq) Object.entries(query.eq).forEach(([k, v]) => { q = q.eq(k, v) })
      if (query.order) q = q.order(query.order.field, { ascending: query.order.ascending ?? true })
      if (query.limit) q = q.limit(query.limit)
      const { data: d, error: e } = await q
      if (e) throw e
      setData(d || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [table, JSON.stringify(query)])

  useEffect(() => { fetch() }, [fetch])
  return { data, loading, error, refetch: fetch }
}

export function useStudents() {
  return useSupabaseQuery('students', { order: { field: 'created_at', ascending: false } })
}

export function useStudent(studentId) {
  return useSupabaseQuery('students', { eq: { student_id: studentId }, limit: 1 })
}

export function useFaculty() {
  return useSupabaseQuery('faculty', { order: { field: 'created_at', ascending: false } })
}

export function useNotices(publishedOnly = false) {
  const query = { order: { field: 'date', ascending: false } }
  if (publishedOnly) query.eq = { is_published: true }
  return useSupabaseQuery('notices', query)
}

export function useResults(studentId) {
  return useSupabaseQuery('results', { eq: { student_id: studentId }, order: { field: 'semester', ascending: true } })
}

export function useFees(studentId) {
  return useSupabaseQuery('fees', { eq: { student_id: studentId }, order: { field: 'created_at', ascending: true } })
}

export function useAttendance(studentId) {
  return useSupabaseQuery('attendance', { eq: { student_id: studentId }, order: { field: 'date', ascending: false } })
}

export function useDepartments() {
  return useSupabaseQuery('departments', { order: { field: 'name', ascending: true } })
}

export function useCourses() {
  return useSupabaseQuery('courses', { eq: { is_active: true }, order: { field: 'name', ascending: true } })
}

export function useSubjects(courseId) {
  const query = { order: { field: 'semester', ascending: true } }
  if (courseId) query.eq = { course_id: courseId }
  return useSupabaseQuery('subjects', query)
}

export function useDashboardStats() {
  const [stats, setStats] = useState({ students: 0, teachers: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const [studentsRes, facultyRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('faculty').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        students: studentsRes.count || 0,
        teachers: facultyRes.count || 0,
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  return { stats, loading, error, refetch: fetch }
}

export async function addStudent(student) {
  const { data, error } = await supabase.from('students').insert(student).select().single()
  if (error) throw error
  return data
}

export async function updateStudent(studentId, updates) {
  const { data, error } = await supabase.from('students').update(updates).eq('student_id', studentId).select().single()
  if (error) throw error
  return data
}

export async function deleteStudent(studentId) {
  const { error } = await supabase.from('students').delete().eq('student_id', studentId)
  if (error) throw error
  return true
}

export async function addFaculty(faculty) {
  const { data, error } = await supabase.from('faculty').insert(faculty).select().single()
  if (error) throw error
  return data
}

export async function updateFaculty(id, updates) {
  const { data, error } = await supabase.from('faculty').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteFaculty(id) {
  const { error } = await supabase.from('faculty').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function addNotice(notice) {
  const { data, error } = await supabase.from('notices').insert(notice).select().single()
  if (error) throw error
  return data
}

export async function updateNotice(id, updates) {
  const { data, error } = await supabase.from('notices').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteNotice(id) {
  const { error } = await supabase.from('notices').delete().eq('id', id)
  if (error) throw error
  return true
}

export async function saveResults(resultsArray) {
  const { error } = await supabase.from('results').insert(resultsArray)
  if (error) throw error
  return true
}

export async function saveAttendance(records) {
  const { error } = await supabase.from('attendance').insert(records)
  if (error) throw error
  return true
}
