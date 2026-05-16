import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../../layouts/DashboardLayout'
import Toast, { useToast } from '../../components/shared/Toast'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import useCountUp from '../../hooks/useCountUp'

const GRADE_COLORS = {
  'A+': 'bg-green-700 text-white',
  A: 'bg-green-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-orange-500 text-white',
  D: 'bg-yellow-400 text-white',
  F: 'bg-red-500 text-white',
}

function AnimatedNumber({ value }) {
  const count = useCountUp(typeof value === 'number' ? value : parseInt(value) || 0)
  return <span>{count.toLocaleString()}</span>
}

function AttendanceRing({ percentage }) {
  const r = 40, circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ
  const color = percentage < 75 ? '#ef4444' : percentage < 85 ? '#f59e0b' : '#10b981'
  
  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800">{percentage}%</span>
    </div>
  )
}

export default function StudentDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'dashboard'
  const setActiveTab = (tab) => setSearchParams({ tab })
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { toasts, addToast, removeToast } = useToast()

  const [studentData, setStudentData] = useState(null)
  const [results, setResults] = useState([])
  const [attendance, setAttendance] = useState([])
  const [notices, setNotices] = useState([])
  const setLoading = useState(true)[1]

  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '', dob: '' })
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [expandedSemester, setExpandedSemester] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const email = user?.email
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single()

      if (student) {
        setStudentData({
          ...student,
          name: student.full_name || student.name,
        })
      }

      const studentId = student?.student_id

      if (studentId) {
        const [resultsRes, attendanceRes, noticesRes] = await Promise.all([
          supabase.from('results').select('*').eq('student_id', studentId),
          supabase.from('attendance').select('*').eq('student_id', studentId),
          supabase.from('notices').select('*').order('date', { ascending: false }).limit(5),
        ])

        setResults((resultsRes.data || []).map(r => ({
          ...r,
          subject: r.subject_name,
          total: r.total ?? 100,
        })))

        const rawAttendance = attendanceRes.data || []
        const grouped = {}
        rawAttendance.forEach(a => {
          if (!grouped[a.subject_name]) {
            grouped[a.subject_name] = { total: 0, attended: 0 }
          }
          grouped[a.subject_name].total++
          if (a.status === 'present' || a.status === 'late') {
            grouped[a.subject_name].attended++
          }
        })
        setAttendance(
          Object.entries(grouped).map(([subject, data], idx) => ({
            id: idx + 1,
            subject,
            total: data.total,
            attended: data.attended,
          }))
        )

        setNotices(noticesRes.data || [])
      } else {
        setNotices([])
        setResults([])
        setAttendance([])
      }
    } catch {
      addToast('Failed to load dashboard data', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const gpa = useMemo(() => {
    if (!results.length) return 0
    const totalPoints = results.reduce((sum, r) => {
      const pct = (r.marks / r.total) * 100
      if (pct >= 90) return sum + 4.0
      if (pct >= 80) return sum + 4.0
      if (pct >= 70) return sum + 3.0
      if (pct >= 60) return sum + 2.0
      if (pct >= 50) return sum + 1.0
      return sum
    }, 0)
    return (totalPoints / results.length).toFixed(2)
  }, [results])

  const attendancePercent = useMemo(() => {
    const total = attendance.reduce((s, a) => s + a.total, 0)
    const attended = attendance.reduce((s, a) => s + a.attended, 0)
    return total > 0 ? Math.round((attended / total) * 100) : 0
  }, [attendance])

  const getGrade = (marks, total) => {
    const pct = (marks / total) * 100
    if (pct >= 90) return 'A+'
    if (pct >= 80) return 'A'
    if (pct >= 70) return 'B'
    if (pct >= 60) return 'C'
    if (pct >= 50) return 'D'
    return 'F'
  }

  const getLetterGrade = (gpaVal) => {
    const g = parseFloat(gpaVal)
    if (g >= 3.7) return 'A+'
    if (g >= 3.3) return 'A'
    if (g >= 2.7) return 'B'
    if (g >= 2.0) return 'C'
    if (g >= 1.0) return 'D'
    return 'F'
  }

  const groupedResults = useMemo(() => {
    const grouped = {}
    results.forEach(r => {
      if (!grouped[r.semester]) grouped[r.semester] = []
      grouped[r.semester].push(r)
    })
    return Object.entries(grouped).sort((a, b) => b[0] - a[0])
  }, [results])

  const handleSaveProfile = async () => {
    try {
      if (studentData?.student_id) {
        await supabase.from('students').update(profileForm).eq('student_id', studentData.student_id)
      }
      addToast('Profile updated successfully!', 'success')
      setStudentData({ ...studentData, ...profileForm })
    } catch {
      addToast('Failed to update profile', 'error')
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      addToast('Passwords do not match', 'error')
      return
    }
    if (passwordForm.new.length < 8) {
      addToast('Password must be at least 8 characters', 'warning')
      return
    }
    try {
      await supabase.auth.updateUser({ password: passwordForm.new })
      addToast('Password updated successfully!', 'success')
      setTimeout(() => { signOut(); navigate('/login') }, 2000)
    } catch {
      addToast('Failed to update password', 'error')
    }
  }

  const daysRemaining = 45

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-[#0f2040] to-[#1d4ed8] rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome back, {studentData?.name || 'Student'}!</h2>
              <div className="flex flex-wrap gap-3 mt-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{studentData?.course || 'Civil Technology'} — Batch {studentData?.batch || '2024'}</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">ID: {studentData?.student_id || 'ST-001'}</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1"><span>Profile Completion</span><span>75%</span></div>
                <div className="h-2 bg-white/20 rounded-full"><div className="h-full w-3/4 bg-[#F57C00] rounded-full" /></div>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-2">GPA</p>
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-bold text-[#0f2040]">{getLetterGrade(gpa)}</span>
                  <span className="text-lg text-gray-500">({gpa})</span>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
                <p className="text-sm text-gray-500 mb-2">Attendance</p>
                <AttendanceRing percentage={attendancePercent} />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-2">Days Remaining</p>
                <p className="text-4xl font-bold text-[#F57C00]"><AnimatedNumber value={daysRemaining} /></p>
                <p className="text-sm text-gray-500">in semester</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-800 text-lg mb-4">My Results</h3>
                  <div className="space-y-2">
                    {groupedResults.map(([sem, semResults]) => (
                      <div key={sem}>
                        <button onClick={() => setExpandedSemester(expandedSemester === sem ? null : sem)} className="w-full flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <span className="font-medium text-gray-700">Semester {sem}</span>
                          <span className="text-gray-400">{expandedSemester === sem ? '▲' : '▼'}</span>
                        </button>
                        {expandedSemester === sem && (
                          <table className="w-full text-sm mt-2">
                            <thead><tr className="text-left text-gray-500"><th className="py-2">Subject</th><th>Exam</th><th>Marks</th><th>Grade</th></tr></thead>
                            <tbody>
                              {semResults.map(r => (
                                <tr key={r.id} className="border-t border-gray-50">
                                  <td className="py-2">{r.subject}</td>
                                  <td className="capitalize text-gray-500">{r.exam_type}</td>
                                  <td>{r.marks}/{r.total}</td>
                                  <td><span className={`px-2 py-0.5 rounded text-xs font-medium ${GRADE_COLORS[getGrade(r.marks, r.total)]}`}>{getGrade(r.marks, r.total)}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Notices</h3>
                <div className="space-y-3">
                  {notices.map(n => (
                    <div key={n.id} className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">{n.category || 'Notice'}</span>
                      <p className="text-sm font-medium text-gray-700 mt-1">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{n.date}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab('notices')} className="text-sm text-[#F57C00] mt-3 hover:underline">View All Notices →</button>
              </div>
            </div>
          </div>
        )

      case 'results':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">My Results</h3>
            {groupedResults.map(([sem, semResults]) => (
              <div key={sem} className="mb-4">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">Semester {sem}</span>
                  <span className="text-sm text-gray-500">GPA: {getLetterGrade((semResults.reduce((s, r) => s + (r.marks/r.total)*4, 0) / semResults.length).toFixed(2))}</span>
                </div>
                <table className="w-full text-sm mt-2">
                  <thead><tr className="text-left text-gray-500"><th className="py-2">Subject</th><th>Exam</th><th>Marks</th><th>Grade</th></tr></thead>
                  <tbody>
                    {semResults.map(r => (
                      <tr key={r.id} className="border-t border-gray-50">
                        <td className="py-2">{r.subject}</td>
                        <td className="capitalize">{r.exam_type}</td>
                        <td>{r.marks}/{r.total}</td>
                        <td><span className={`px-2 py-0.5 rounded text-xs font-medium ${GRADE_COLORS[getGrade(r.marks, r.total)]}`}>{getGrade(r.marks, r.total)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )

      case 'attendance':
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Overall Attendance</h3>
              <AttendanceRing percentage={attendancePercent} />
              <p className="mt-4 text-gray-600">
                {attendancePercent < 75 ? '⚠️ Below minimum attendance!' : attendancePercent < 85 ? 'Moderate attendance' : 'Good attendance!'}
              </p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Subject-wise</h3>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th className="py-2">Subject</th><th className="text-center">Present</th><th className="text-center">Total</th><th className="text-center">%</th></tr></thead>
                <tbody>
                  {attendance.map(a => {
                    const pct = Math.round((a.attended / a.total) * 100)
                    return (
                      <tr key={a.id} className="border-t border-gray-50">
                        <td className="py-2">{a.subject}</td>
                        <td className="text-center">{a.attended}</td>
                        <td className="text-center">{a.total}</td>
                        <td className="text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${pct < 75 ? 'bg-red-100 text-red-600' : pct < 85 ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>{pct}%</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'notices':
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 text-lg">Notices</h3>
            {notices.map(n => (
              <div key={n.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">{n.category || 'Notice'}</span>
                  <span className="text-xs text-gray-400">{n.date}</span>
                </div>
                <h4 className="font-medium text-gray-800">{n.title}</h4>
                <p className="text-sm text-gray-500 mt-2">{n.body || 'No content'}</p>
              </div>
            ))}
          </div>
        )

      case 'profile':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-32 h-32 bg-[#0f2040] rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                {studentData?.name?.charAt(0) || 'S'}
              </div>
              <button className="px-4 py-2 bg-[#F57C00] text-white rounded-xl text-sm">Change Photo</button>
              <div className="mt-6 space-y-2 text-left">
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Student ID</span><span className="font-medium">{studentData?.student_id || 'ST-001'}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Course</span><span className="font-medium">{studentData?.course || 'Civil Technology'}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Batch</span><span className="font-medium">{studentData?.batch || '2024'}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Year</span><span className="font-medium">{studentData?.year || '3rd'}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Status</span><span className="font-medium text-green-600">{studentData?.status || 'Active'}</span></div>
                <div className="flex justify-between py-2"><span className="text-gray-500">Enrolled</span><span className="font-medium">{studentData?.enrolled_date || '2022-09-01'}</span></div>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Edit Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-500 block mb-1">Full Name</label><input type="text" value={profileForm.name || studentData?.name || ''} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" /></div>
                <div><label className="text-sm text-gray-500 block mb-1">Phone</label><input type="text" value={profileForm.phone || studentData?.phone || ''} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" /></div>
                <div className="col-span-2"><label className="text-sm text-gray-500 block mb-1">Address</label><input type="text" value={profileForm.address || studentData?.address || ''} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" /></div>
                <div className="col-span-2"><label className="text-sm text-gray-500 block mb-1">Date of Birth</label><input type="date" value={profileForm.dob || ''} onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" /></div>
              </div>
              <button onClick={handleSaveProfile} className="mt-4 px-6 py-2.5 bg-[#0f2040] text-white rounded-xl text-sm font-medium">Save Changes</button>
            </div>
          </div>
        )

      case 'password':
        return (
          <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Change Password</h3>
            <div className="space-y-4">
              <div><label className="text-sm text-gray-500 block mb-1">Current Password</label><input type="password" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" /></div>
              <div><label className="text-sm text-gray-500 block mb-1">New Password</label><input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" /></div>
              <div><label className="text-sm text-gray-500 block mb-1">Confirm New Password</label><input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" /></div>
            </div>
            <button onClick={handleChangePassword} className="mt-4 w-full py-2.5 bg-[#F57C00] text-white rounded-xl text-sm font-medium">Update Password</button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab} role="student">
        {renderContent()}
      </DashboardLayout>
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  )
}
