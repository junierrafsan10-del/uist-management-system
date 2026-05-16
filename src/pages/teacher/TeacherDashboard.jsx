import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import DashboardLayout from '../../layouts/DashboardLayout'
import Toast, { useToast } from '../../components/shared/Toast'
import { supabase } from '../../lib/supabase'
import useCountUp from '../../hooks/useCountUp'

function AnimatedNumber({ value }) {
  const count = useCountUp(typeof value === 'number' ? value : parseInt(value) || 0)
  return <span>{count.toLocaleString()}</span>
}

export default function TeacherDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'dashboard'
  const setActiveTab = (tab) => setSearchParams({ tab })
  const { toasts, addToast, removeToast } = useToast()

  const [teacherData, setTeacherData] = useState(null)
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const setNotices = useState([])[1]
  const [attendanceData, setAttendanceData] = useState({})
  const setLoading = useState(true)[1]

  const [noticeForm, setNoticeForm] = useState({ title: '', category: 'Academic', content: '' })
  const [resultForm, setResultForm] = useState({ student_id: '', course: '', exam_type: 'midterm', marks: '', total: '100' })
  const [filterCourse, setFilterCourse] = useState('')
  const [searchStudent, setSearchStudent] = useState('')

  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [teacherRes, studentsRes, coursesRes, noticesRes] = await Promise.all([
        supabase.from('faculty').select('*').limit(1).single(),
        supabase.from('students').select('*'),
        supabase.from('courses').select('*').eq('is_active', true),
        supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(5),
      ])
      if (teacherRes.data) {
        setTeacherData({
          ...teacherRes.data,
          name: teacherRes.data.full_name || teacherRes.data.name,
        })
      }
      setStudents((studentsRes.data || []).map(s => ({
        ...s,
        name: s.full_name || s.name,
        gpa: s.cgpa || s.gpa || 'N/A',
        attendance: s.attendance ?? 0,
        course: s.course || '',
      })))
      setCourses(coursesRes.data?.map(c => c.name) || [])
      setNotices(noticesRes.data || [])
    } catch {
      addToast('Failed to load dashboard data', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredStudents = useMemo(() => {
    let result = [...students]
    if (searchStudent) {
      const s = searchStudent.toLowerCase()
      result = result.filter(st => st.name?.toLowerCase().includes(s) || st.student_id?.toLowerCase().includes(s))
    }
    if (filterCourse) result = result.filter(st => st.course === filterCourse)
    return result
  }, [students, searchStudent, filterCourse])

  const totalStudents = students.length
  const pendingAttendance = 2
  const avgPerformance = 82

  const handlePostNotice = async () => {
    if (!noticeForm.title) {
      addToast('Title is required', 'warning')
      return
    }
    try {
      await supabase.from('notices').insert({
        title: noticeForm.title,
        body: noticeForm.content,
        category: noticeForm.category,
        date: new Date().toISOString().split('T')[0],
        is_published: false,
      })
      addToast('Notice posted for approval!', 'success')
      setNoticeForm({ title: '', category: 'Academic', content: '' })
    } catch {
      addToast('Failed to post notice', 'error')
    }
  }

  const handleAddResult = async () => {
    if (!resultForm.student_id || !resultForm.marks) {
      addToast('Please fill required fields', 'warning')
      return
    }
    try {
      await supabase.from('results').insert({
        student_id: resultForm.student_id,
        subject_name: resultForm.course,
        exam_type: resultForm.exam_type,
        marks: parseFloat(resultForm.marks),
        credits: 3,
        semester: 1,
      })
      addToast('Result added!', 'success')
      setResultForm({ student_id: '', course: '', exam_type: 'midterm', marks: '', total: '100' })
    } catch {
      addToast('Failed to add result', 'error')
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Total Students</p>
                <p className="text-2xl font-bold text-[#0f2040]"><AnimatedNumber value={totalStudents} /></p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Classes Today</p>
                <p className="text-2xl font-bold text-[#0f2040]">3</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Pending Attendance</p>
                <p className="text-2xl font-bold text-orange-500"><AnimatedNumber value={pendingAttendance} /></p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Avg Performance</p>
                <p className="text-2xl font-bold text-green-500">{avgPerformance}%</p>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Quick Mark Attendance</h3>
                <div className="flex gap-4">
                  <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
                    <option value="">Select Course</option>
                    {courses.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                  <button onClick={() => setActiveTab('attendance')} disabled={!selectedCourse} className="px-4 py-2.5 bg-[#F57C00] text-white rounded-xl text-sm font-medium disabled:opacity-50">Start Marking</button>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-xl"><p className="text-sm">Marked attendance for CSE</p><p className="text-xs text-gray-400">2 hours ago</p></div>
                  <div className="p-3 bg-gray-50 rounded-xl"><p className="text-sm">Added results for ST-001</p><p className="text-xs text-gray-400">5 hours ago</p></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">My Students</h3>
              <div className="flex gap-4 mb-4">
                <input type="text" placeholder="Search by name..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
                <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
                  <option value="">All Courses</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-gray-500"><th className="py-2">Name</th><th>Student ID</th><th>Course</th><th>Attendance %</th><th>GPA</th></tr></thead>
                <tbody>
                  {filteredStudents.slice(0, 10).map(s => (
                    <tr key={s.student_id} className="border-t border-gray-50">
                      <td className="py-2 font-medium">{s.name}</td>
                      <td className="text-gray-500">{s.student_id}</td>
                      <td>{s.course}</td>
                      <td><span className={`px-2 py-0.5 rounded text-xs ${s.attendance >= 75 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{s.attendance}%</span></td>
                      <td>{s.gpa || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case 'attendance':
        return (
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
                <option value="">Select Course</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
            {selectedCourse && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-4">Mark Attendance - {selectedCourse}</h3>
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500"><th className="py-2">Student</th><th className="text-center">Present</th><th className="text-center">Absent</th><th className="text-center">Late</th></tr></thead>
                  <tbody>
                    {students.filter(s => s.course === selectedCourse).map(s => {
                      const status = attendanceData[`${selectedCourse}-${selectedDate}`]?.[s.student_id] || 'present'
                      return (
                        <tr key={s.student_id} className="border-t border-gray-50">
                          <td className="py-2">{s.name}</td>
                          <td className="text-center">
                            <button onClick={() => setAttendanceData({ ...attendanceData, [`${selectedCourse}-${selectedDate}`]: { ...attendanceData[`${selectedCourse}-${selectedDate}`], [s.student_id]: 'present' } })} className={`px-3 py-1 rounded ${status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}>✅</button>
                          </td>
                          <td className="text-center">
                            <button onClick={() => setAttendanceData({ ...attendanceData, [`${selectedCourse}-${selectedDate}`]: { ...attendanceData[`${selectedCourse}-${selectedDate}`], [s.student_id]: 'absent' } })} className={`px-3 py-1 rounded ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}>❌</button>
                          </td>
                          <td className="text-center">
                            <button onClick={() => setAttendanceData({ ...attendanceData, [`${selectedCourse}-${selectedDate}`]: { ...attendanceData[`${selectedCourse}-${selectedDate}`], [s.student_id]: 'late' } })} className={`px-3 py-1 rounded ${status === 'late' ? 'bg-orange-400 text-white' : 'bg-gray-100'}`}>⏰</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <button onClick={() => addToast('Attendance submitted!', 'success')} className="mt-4 px-6 py-2.5 bg-[#0f2040] text-white rounded-xl text-sm font-medium">Submit Attendance</button>
              </div>
            )}
          </div>
        )

      case 'results':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Enter Results</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <select value={resultForm.student_id} onChange={(e) => setResultForm({ ...resultForm, student_id: e.target.value })} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
                <option value="">Select Student</option>
                {students.map(s => <option key={s.student_id} value={s.student_id}>{s.name} ({s.student_id})</option>)}
              </select>
              <select value={resultForm.course} onChange={(e) => setResultForm({ ...resultForm, course: e.target.value })} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
                <option value="">Select Course</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={resultForm.exam_type} onChange={(e) => setResultForm({ ...resultForm, exam_type: e.target.value })} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
              </select>
              <input type="number" placeholder="Marks" value={resultForm.marks} onChange={(e) => setResultForm({ ...resultForm, marks: e.target.value })} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
            </div>
            <button onClick={handleAddResult} className="px-6 py-2.5 bg-[#0f2040] text-white rounded-xl text-sm font-medium">Add Result</button>
          </div>
        )

      case 'notices':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Post Notice (Requires Admin Approval)</h3>
            <div className="space-y-4">
              <input type="text" placeholder="Notice Title" value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <select value={noticeForm.category} onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
                <option value="Academic">Academic</option>
                <option value="Event">Event</option>
                <option value="Notice">Notice</option>
                <option value="Urgent">Urgent</option>
              </select>
              <textarea placeholder="Notice Content" rows={4} value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm resize-none" />
              <button onClick={handlePostNotice} className="px-6 py-2.5 bg-[#F57C00] text-white rounded-xl text-sm font-medium">Submit for Approval</button>
            </div>
          </div>
        )

      case 'students':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">My Students</h3>
            <div className="flex gap-4 mb-4">
              <input type="text" placeholder="Search..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm" />
              <select value={filterCourse} onChange={(e) => setFilterCourse(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm">
                <option value="">All Courses</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-gray-500"><th className="py-2">Name</th><th>ID</th><th>Course</th><th>Attendance</th><th>GPA</th></tr></thead>
              <tbody>
                {filteredStudents.map(s => (
                  <tr key={s.student_id} className="border-t border-gray-50">
                    <td className="py-2">{s.name}</td>
                    <td>{s.student_id}</td>
                    <td>{s.course}</td>
                    <td><span className={`px-2 py-0.5 rounded text-xs ${s.attendance >= 75 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{s.attendance}%</span></td>
                    <td>{s.gpa || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'profile':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-32 h-32 bg-[#0f2040] rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                {teacherData?.name?.charAt(0) || 'T'}
              </div>
              <h3 className="text-xl font-semibold text-gray-800">{teacherData?.name || 'Teacher'}</h3>
              <p className="text-gray-500">{teacherData?.department || 'CSE'} Department</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 text-lg mb-4">Contact Info</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Email</span><span>{teacherData?.email || 'teacher@ucep.edu'}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Phone</span><span>{teacherData?.phone || '01711111111'}</span></div>
                <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Department</span><span>{teacherData?.department || 'CSE'}</span></div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab} role="teacher">
        {renderContent()}
      </DashboardLayout>
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  )
}
