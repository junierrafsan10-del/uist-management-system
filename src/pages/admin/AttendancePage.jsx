import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../layouts/DashboardLayout'
import Toast, { useToast } from '../../components/shared/Toast'
import { supabase } from '../../lib/supabase'

const STATUS_COLORS = {
  present: 'bg-green-500 text-white',
  absent: 'bg-red-500 text-white',
  late: 'bg-orange-500 text-white',
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('attendance')
  const [mode, setMode] = useState('mark') // 'mark' or 'view'
  
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [attendanceData, setAttendanceData] = useState({})
  const setLoading = useState(true)[1]
  const { toasts, addToast, removeToast } = useToast()

  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // View mode
  const [viewStudent, setViewStudent] = useState('')
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1)
  const [viewYear, setViewYear] = useState(new Date().getFullYear())

  const fetchData = async () => {
    setLoading(true)
    try {
      const [studentsRes, coursesRes, attendanceRes] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('courses').select('name').eq('is_active', true),
        supabase.from('attendance').select('*'),
      ])

      const mappedStudents = (studentsRes.data || []).map(s => ({
        ...s,
        name: s.full_name,
        course: s.course_id || '',
      }))
      setStudents(mappedStudents)
      setCourses(coursesRes.data?.map(c => c.name) || [])

      const attData = {}
      attendanceRes.data?.forEach(a => {
        const key = `${a.subject_name}-${a.date}`
        if (!attData[key]) attData[key] = {}
        attData[key][a.student_id] = a.status
      })
      setAttendanceData(attData)
    } catch {
      addToast('Failed to fetch data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredStudents = useMemo(() => {
    if (!selectedCourse) return []
    return students.filter(s => s.course === selectedCourse)
  }, [students, selectedCourse])

  const currentAttendance = useMemo(() => {
    if (!selectedCourse || !selectedDate) return {}
    const key = `${selectedCourse}-${selectedDate}`
    return attendanceData[key] || {}
  }, [attendanceData, selectedCourse, selectedDate])

  const handleMarkAttendance = (studentId, status) => {
    setAttendanceData(prev => {
      const key = `${selectedCourse}-${selectedDate}`
      const newData = { ...prev }
      if (!newData[key]) newData[key] = {}
      newData[key][studentId] = status
      return newData
    })
  }

  const handleMarkAllPresent = () => {
    filteredStudents.forEach(s => {
      handleMarkAttendance(s.student_id, 'present')
    })
  }

  const submitAttendance = async () => {
    const courseKey = `${selectedCourse}-${selectedDate}`
    const dayData = attendanceData[courseKey] || {}
    
    try {
      for (const [studentId, status] of Object.entries(dayData)) {
        const { error } = await supabase.from('attendance').upsert({
          student_id: studentId,
          subject_name: selectedCourse,
          date: selectedDate,
          status: status,
        }, { onConflict: 'student_id,subject_name,date' })

        if (error) throw error
      }
      addToast('Attendance submitted!', 'success')
    } catch {
      addToast('Failed to submit attendance', 'error')
    }
  }

  // View mode calculations
  const viewAttendanceData = useMemo(() => {
    if (!viewStudent || !viewMonth || !viewYear) return null
    
    const student = students.find(s => s.student_id === viewStudent)
    if (!student) return null

    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
    const attendance = {}
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      attendance[day] = attendanceData[`${student.course}-${dateStr}`]?.[viewStudent] || null
    }

    const present = Object.values(attendance).filter(s => s === 'present').length
    const absent = Object.values(attendance).filter(s => s === 'absent').length
    const late = Object.values(attendance).filter(s => s === 'late').length
    const totalDays = Object.values(attendance).filter(Boolean).length
    const percentage = totalDays > 0 ? Math.round(((present + late * 0.5) / totalDays) * 100) : 0

    return { attendance, student, present, absent, late, percentage, totalDays }
  }, [viewStudent, viewMonth, viewYear, students, attendanceData])

  const getAttendanceColor = (status) => {
    if (status === 'present') return 'bg-green-500'
    if (status === 'absent') return 'bg-red-500'
    if (status === 'late') return 'bg-orange-400'
    return 'bg-gray-100'
  }

  const attendanceCounts = useMemo(() => {
    const courseKey = `${selectedCourse}-${selectedDate}`
    const dayData = attendanceData[courseKey] || {}
    const present = Object.values(dayData).filter(s => s === 'present').length
    const absent = Object.values(dayData).filter(s => s === 'absent').length
    const late = Object.values(dayData).filter(s => s === 'late').length
    return { present, absent, late }
  }, [attendanceData, selectedCourse, selectedDate])

  return (
    <>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 bg-white rounded-xl p-1 w-fit shadow-sm">
            <button
              onClick={() => setMode('mark')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'mark' ? 'bg-[#F57C00] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              📝 Mark Attendance
            </button>
            <button
              onClick={() => setMode('view')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'view' ? 'bg-[#F57C00] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              📊 View Attendance
            </button>
          </div>

          {mode === 'mark' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Course</label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                  >
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                  />
                </div>
                <button
                  onClick={handleMarkAllPresent}
                  disabled={!selectedCourse}
                  className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 mt-5"
                >
                  Mark All Present
                </button>
              </div>

              {selectedCourse && (
                <>
                  <div className="flex gap-4 text-sm">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full"></span> Present: {attendanceCounts.present}</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Absent: {attendanceCounts.absent}</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 rounded-full"></span> Late: {attendanceCounts.late}</span>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-4 py-3 font-medium">Student ID</th>
                          <th className="px-4 py-3 font-medium">Name</th>
                          <th className="px-4 py-3 text-center font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {filteredStudents.map((student, i) => {
                          const status = currentAttendance[student.student_id] || 'present'
                          return (
                            <motion.tr
                              key={student.student_id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.02 }}
                              className="hover:bg-gray-50/50"
                            >
                              <td className="px-4 py-3 text-gray-600 font-mono">{student.student_id}</td>
                              <td className="px-4 py-3 font-medium text-gray-800">{student.name}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2 justify-center">
                                  {['present', 'absent', 'late'].map(s => (
                                    <button
                                      key={s}
                                      onClick={() => handleMarkAttendance(student.student_id, s)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        status === s 
                                          ? STATUS_COLORS[s] + ' ring-2 ring-offset-1 ring-' + (s === 'present' ? 'green-400' : s === 'absent' ? 'red-400' : 'orange-400')
                                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                    >
                                      {s === 'present' ? '✅' : s === 'absent' ? '❌' : '⏰'} {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={submitAttendance}
                    disabled={!selectedCourse || filteredStudents.length === 0}
                    className="px-6 py-2.5 bg-[#0f2040] text-white rounded-xl text-sm font-medium hover:bg-[#0f2040]/90 disabled:opacity-50"
                  >
                    Submit Attendance
                  </button>
                </>
              )}
            </div>
          )}

          {mode === 'view' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Student</label>
                  <select
                    value={viewStudent}
                    onChange={(e) => setViewStudent(e.target.value)}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00] w-64"
                  >
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Month</label>
                  <select
                    value={viewMonth}
                    onChange={(e) => setViewMonth(parseInt(e.target.value))}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('en', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Year</label>
                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(parseInt(e.target.value))}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                  >
                    {[2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {viewAttendanceData && (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">Attendance Summary - {viewAttendanceData.student?.name}</h3>
                    <div className="flex flex-wrap gap-6 mb-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-500">{viewAttendanceData.present}</p>
                        <p className="text-sm text-gray-500">Present</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-red-500">{viewAttendanceData.absent}</p>
                        <p className="text-sm text-gray-500">Absent</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold text-orange-500">{viewAttendanceData.late}</p>
                        <p className="text-sm text-gray-500">Late</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-3xl font-bold ${viewAttendanceData.percentage < 75 ? 'text-red-500' : viewAttendanceData.percentage < 85 ? 'text-orange-500' : 'text-green-500'}`}>
                          {viewAttendanceData.percentage}%
                        </p>
                        <p className="text-sm text-gray-500">Percentage</p>
                      </div>
                    </div>
                    {viewAttendanceData.percentage < 75 && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm font-medium">
                        ⚠️ Below minimum attendance! Required: 75%
                      </div>
                    )}
                  </div>

                  {/* Calendar Grid */}
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 text-lg mb-4">Calendar</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
                      ))}
                      {Array.from({ length: new Date(viewYear, viewMonth - 1, 1).getDay() }, (_, i) => (
                        <div key={`empty-${i}`}></div>
                      ))}
                      {Object.entries(viewAttendanceData.attendance).map(([day, status]) => (
                        <div
                          key={day}
                          className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${getAttendanceColor(status)} ${status ? 'text-white' : 'text-gray-300'}`}
                          title={`Day ${day}: ${status || 'No class'}`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded"></span> Present</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded"></span> Absent</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 rounded"></span> Late</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 rounded"></span> No class</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Toast toasts={toasts} removeToast={removeToast} />
      </DashboardLayout>
    </>
  )
}
