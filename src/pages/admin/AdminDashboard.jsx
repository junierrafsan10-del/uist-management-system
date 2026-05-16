import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import DashboardLayout from '../../layouts/DashboardLayout'
import Modal from '../../components/shared/Modal'
import Toast, { useToast } from '../../components/shared/Toast'
import { supabase } from '../../lib/supabase'
import useCountUp from '../../hooks/useCountUp'

const CHART_COLORS = ['#2196F3', '#43A047', '#F57C00', '#00ACC1', '#9C27B0', '#E91E63']

function AnimatedNumber({ value, prefix = '' }) {
  const count = useCountUp(typeof value === 'number' ? value : parseInt(value) || 0)
  return <span>{prefix}{count.toLocaleString()}</span>
}

function StatCard({ icon, label, value, color, trend }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    teal: 'bg-teal-100 text-teal-600',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colorClasses[color]}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-800 mb-1">
        <AnimatedNumber value={value} />
      </p>
      <p className="text-sm text-gray-500">{label}</p>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'dashboard'
  const setActiveTab = (tab) => setSearchParams({ tab })
  const [stats, setStats] = useState({ students: 0, teachers: 0, courses: 0, placements: 0 })
  const [recentStudents, setRecentStudents] = useState([])
  const [recentNotices, setRecentNotices] = useState([])
  const [monthlyAdmissions, setMonthlyAdmissions] = useState([])
  const [deptDistribution, setDeptDistribution] = useState([])
  const [loading, setLoading] = useState(true)
  const { toasts, addToast, removeToast } = useToast()

  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showAddNoticeModal, setShowAddNoticeModal] = useState(false)
  const [studentForm, setStudentForm] = useState({
    name: '', email: '', phone: '', student_id: '', dept: 'CSE', year: '1st', sem: 1, address: ''
  })
  const [noticeForm, setNoticeForm] = useState({ title: '', body: '' })

  const [teachers, setTeachers] = useState([])
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false)
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false)
  const [showDeleteTeacherModal, setShowDeleteTeacherModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [teacherForm, setTeacherForm] = useState({
    name: '', email: '', phone: '', designation: '', department: 'CSE'
  })
  const [deleteTeacherConfirm, setDeleteTeacherConfirm] = useState('')

  const fetchDashboardData = async () => {
    try {
      const [studentsRes, teachersRes, noticesRes, teachersData] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('faculty').select('*', { count: 'exact', head: true }),
        supabase.from('notices').select('*').order('created_at', { ascending: false }).limit(3),
        supabase.from('faculty').select('*, departments(name)').order('created_at', { ascending: false }),
      ])

      const studentsCount = studentsRes.count || 0
      const teachersCount = teachersRes.count || 0

      const mappedTeachers = (teachersData.data || []).map(t => ({
        ...t,
        name: t.full_name,
        dept_name: t.departments?.name || '',
      }))
      setTeachers(mappedTeachers)

      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      const mappedStudents = (studentsData || []).map(s => ({
        id: s.student_id,
        name: s.full_name,
        dept: s.course_id || s.department_id || '',
        year: s.year,
        created_at: s.created_at,
      }))

      const deptCount = {}
      mappedStudents.forEach(s => {
        deptCount[s.dept] = (deptCount[s.dept] || 0) + 1
      })
      const deptDist = Object.entries(deptCount).map(([name, value]) => ({ name, value }))

      setStats({
        students: studentsCount,
        teachers: teachersCount,
        courses: 6,
        placements: 45,
      })
      setRecentStudents(mappedStudents)
      setRecentNotices(noticesRes.data || [])
      setDeptDistribution(deptDist)

      const mockMonthly = [
        { name: 'Jan', admissions: 12 }, { name: 'Feb', admissions: 8 },
        { name: 'Mar', admissions: 15 }, { name: 'Apr', admissions: 10 },
        { name: 'May', admissions: 18 }, { name: 'Jun', admissions: 14 },
      ]
      setMonthlyAdmissions(mockMonthly)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      addToast('Failed to load dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleAddStudent = async () => {
    try {
      if (!studentForm.name || !studentForm.student_id) {
        addToast('Name and Student ID are required', 'warning')
        return
      }

      const { error } = await supabase.from('students').insert({
        student_id: studentForm.student_id,
        full_name: studentForm.name,
        email: studentForm.email,
        phone: studentForm.phone,
        course: studentForm.dept,
        batch: studentForm.year,
        year: studentForm.year,
        semester: studentForm.sem,
        address: studentForm.address,
        cgpa: 0,
        status: 'active',
      })

      if (error) throw error
      addToast('Student added successfully!', 'success')
      setShowAddStudentModal(false)
      setStudentForm({ name: '', email: '', phone: '', student_id: '', dept: 'CSE', year: '1st', sem: 1, address: '' })
      fetchDashboardData()
    } catch (error) {
      addToast('Failed to add student: ' + error.message, 'error')
    }
  }

  const handleAddNotice = async () => {
    try {
      if (!noticeForm.title) {
        addToast('Notice title is required', 'warning')
        return
      }

      const { error } = await supabase.from('notices').insert({
        title: noticeForm.title,
        body: noticeForm.body,
        date: new Date().toISOString().split('T')[0],
      })

      if (error) throw error
      addToast('Notice posted successfully!', 'success')
      setShowAddNoticeModal(false)
      setNoticeForm({ title: '', body: '' })
      fetchDashboardData()
    } catch (error) {
      addToast('Failed to post notice: ' + error.message, 'error')
    }
  }

  const handleAddTeacher = async () => {
    if (!teacherForm.name) {
      addToast('Teacher name is required', 'warning')
      return
    }
    try {
      const deptId = (await supabase.from('departments').select('id').eq('code', teacherForm.department).single()).data?.id
      const { error } = await supabase.from('faculty').insert({
        full_name: teacherForm.name,
        email: teacherForm.email,
        phone: teacherForm.phone,
        designation: teacherForm.designation,
        department_id: deptId,
      })
      if (error) throw error
      addToast('Teacher added successfully!', 'success')
      setShowAddTeacherModal(false)
      setTeacherForm({ name: '', email: '', phone: '', designation: '', department: 'CSE' })
      fetchDashboardData()
    } catch (error) {
      addToast('Failed to add teacher: ' + error.message, 'error')
    }
  }

  const handleEditTeacher = async () => {
    if (!teacherForm.name || !selectedTeacher) return
    try {
      const deptId = (await supabase.from('departments').select('id').eq('code', teacherForm.department).single()).data?.id
      const { error } = await supabase.from('faculty').update({
        full_name: teacherForm.name,
        email: teacherForm.email,
        phone: teacherForm.phone,
        designation: teacherForm.designation,
        department_id: deptId,
      }).eq('id', selectedTeacher.id)
      if (error) throw error
      addToast('Teacher updated successfully!', 'success')
      setShowEditTeacherModal(false)
      setSelectedTeacher(null)
      fetchDashboardData()
    } catch (error) {
      addToast('Failed to update teacher: ' + error.message, 'error')
    }
  }

  const handleDeleteTeacher = async () => {
    if (!selectedTeacher) return
    if (deleteTeacherConfirm !== selectedTeacher.full_name) {
      addToast('Type teacher name to confirm', 'warning')
      return
    }
    try {
      const { error } = await supabase.from('faculty').delete().eq('id', selectedTeacher.id)
      if (error) throw error
      addToast('Teacher deleted!', 'success')
      setShowDeleteTeacherModal(false)
      setSelectedTeacher(null)
      setDeleteTeacherConfirm('')
      fetchDashboardData()
    } catch (error) {
      addToast('Failed to delete teacher: ' + error.message, 'error')
    }
  }

  const handleExportReport = () => {
    addToast('Exporting report...', 'info')
    setTimeout(() => {
      addToast('Report exported successfully!', 'success')
    }, 1500)
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0f2040]"></div>
        </div>
      )
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon="🎓" label="Total Students" value={stats.students} color="blue" trend={12} />
              <StatCard icon="👨‍🏫" label="Total Teachers" value={stats.teachers} color="green" trend={5} />
              <StatCard icon="📚" label="Active Courses" value={stats.courses} color="orange" trend={0} />
              <StatCard icon="💼" label="Placed Students" value={stats.placements} color="teal" trend={8} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Monthly Admissions</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyAdmissions}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="admissions" fill="#F57C00" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Students by Course</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={deptDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {deptDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800 text-lg">Recent Students</h3>
                  <button className="text-sm text-[#F57C00] hover:underline font-medium">View All →</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-gray-500">
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Course</th>
                        <th className="px-4 py-3 font-medium">Batch</th>
                        <th className="px-4 py-3 font-medium">Date Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentStudents.map((student, i) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-gray-50/50"
                        >
                          <td className="px-4 py-3 text-gray-700 font-medium">{student.name}</td>
                          <td className="px-4 py-3 text-gray-600">{student.dept}</td>
                          <td className="px-4 py-3 text-gray-600">{student.year}</td>
                          <td className="px-4 py-3 text-gray-500">{student.created_at || 'N/A'}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAddStudentModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[#0f2040] text-white rounded-xl text-sm font-medium hover:bg-[#0f2040]/90 transition-all"
                  >
                    <span className="text-lg">+</span> Add Student
                  </button>
                  <button
                    onClick={() => setShowAddNoticeModal(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-[#F57C00] text-white rounded-xl text-sm font-medium hover:bg-[#F57C00]/90 transition-all"
                  >
                    <span>📋</span> Add Notice
                  </button>
                  <button
                    onClick={handleExportReport}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-all"
                  >
                    <span>📊</span> Export Report
                  </button>
                  <button
                    onClick={() => { setActiveTab('attendance') }}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 transition-all"
                  >
                    <span>✅</span> Mark Attendance
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Recent Notices</h3>
                <div className="space-y-3">
                  {recentNotices.length > 0 ? recentNotices.map((notice, i) => (
                    <motion.div
                      key={notice.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">{notice.title}</p>
                        <p className="text-xs text-gray-500">{notice.date}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-lg">Active</span>
                    </motion.div>
                  )) : (
                    <p className="text-sm text-gray-500">No notices yet</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 text-lg mb-4">Recent Placements</h3>
                <div className="space-y-3">
                  {[
                    { company: 'Google', student: 'Arif Hossain', date: '2h ago' },
                    { company: 'Microsoft', student: 'Fatima Begum', date: '1d ago' },
                    { company: 'Amazon', student: 'Tanvir Ahmed', date: '2d ago' },
                  ].map((placement, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-700">{placement.student}</p>
                        <p className="text-xs text-gray-500">{placement.company}</p>
                      </div>
                      <span className="text-xs text-gray-400">{placement.date}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'students':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-lg">All Students ({stats.students})</h3>
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2 bg-[#0f2040] text-white rounded-xl text-sm font-medium"
              >
                + Add Student
              </button>
            </div>
            <p className="text-gray-500 text-sm">Student management coming soon...</p>
          </div>
        )

      case 'teachers':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-lg">All Teachers ({teachers.length})</h3>
              <button
                onClick={() => { setTeacherForm({ name: '', email: '', phone: '', designation: '', department: 'CSE' }); setShowAddTeacherModal(true) }}
                className="px-4 py-2 bg-[#0f2040] text-white rounded-xl text-sm font-medium"
              >
                + Add Teacher
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Designation</th>
                      <th className="px-4 py-3 font-medium">Department</th>
                      <th className="px-4 py-3 font-medium">Phone</th>
                      <th className="px-4 py-3 text-center font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {teachers.map((t, i) => (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">{t.full_name}</td>
                        <td className="px-4 py-3 text-gray-600">{t.email || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{t.designation || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{t.dept_name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{t.phone || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => { setSelectedTeacher(t); setTeacherForm({ name: t.full_name, email: t.email || '', phone: t.phone || '', designation: t.designation || '', department: t.dept_name || 'CSE' }); setShowEditTeacherModal(true) }}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Edit"
                            >✏️</button>
                            <button
                              onClick={() => { setSelectedTeacher(t); setShowDeleteTeacherModal(true) }}
                              className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Delete"
                            >🗑️</button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {teachers.length === 0 && (
                <div className="p-8 text-center text-gray-500">No teachers found. Add your first teacher.</div>
              )}
            </div>
          </div>
        )

      case 'courses':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">All Courses ({stats.courses})</h3>
            <p className="text-gray-500 text-sm">Course management coming soon...</p>
          </div>
        )

      case 'notices':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-lg">All Notices</h3>
              <button
                onClick={() => setShowAddNoticeModal(true)}
                className="px-4 py-2 bg-[#F57C00] text-white rounded-xl text-sm font-medium"
              >
                + Post Notice
              </button>
            </div>
            <div className="space-y-3">
              {recentNotices.map((notice) => (
                <div key={notice.id} className="p-4 bg-gray-50 rounded-xl">
                  <h4 className="font-medium text-gray-700">{notice.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{notice.body}</p>
                  <p className="text-xs text-gray-400 mt-2">{notice.date}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 'attendance':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Attendance Management</h3>
            <p className="text-gray-500 text-sm">Attendance features coming soon...</p>
          </div>
        )

      case 'placements':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Job Placements</h3>
            <p className="text-gray-500 text-sm">Placement management coming soon...</p>
          </div>
        )

      case 'documents':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 text-lg mb-4">Documents</h3>
            <p className="text-gray-500 text-sm">Document management coming soon...</p>
          </div>
        )

      case 'settings':
        return (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl">
            <h3 className="font-semibold text-gray-800 text-lg mb-6">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Institute Name</label>
                <input
                  type="text"
                  defaultValue="UCEP Institute of Science and Technology"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Email</label>
                <input
                  type="email"
                  defaultValue="info@ucep.edu.bd"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                />
              </div>
              <button
                onClick={() => addToast('Settings saved!', 'success')}
                className="px-6 py-2.5 bg-[#0f2040] text-white rounded-xl text-sm font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </DashboardLayout>

      <Modal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        title="Add New Student"
        footer={
          <>
            <button
              onClick={() => setShowAddStudentModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStudent}
              className="px-4 py-2 bg-[#0f2040] text-white rounded-xl text-sm font-medium hover:bg-[#0f2040]/90"
            >
              Add Student
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Full Name *</label>
            <input
              type="text"
              value={studentForm.name}
              onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              placeholder="Enter full name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Student ID *</label>
              <input
                type="text"
                value={studentForm.student_id}
                onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                placeholder="S1001"
              />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Department</label>
              <select
                value={studentForm.dept}
                onChange={(e) => setStudentForm({ ...studentForm, dept: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              >
                <option>CSE</option>
                <option>EEE</option>
                <option>BBA</option>
                <option>Civil</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Year</label>
              <select
                value={studentForm.year}
                onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              >
                <option>1st</option>
                <option>2nd</option>
                <option>3rd</option>
                <option>4th</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Semester</label>
              <select
                value={studentForm.sem}
                onChange={(e) => setStudentForm({ ...studentForm, sem: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Email</label>
            <input
              type="email"
              value={studentForm.email}
              onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              placeholder="student@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Phone</label>
            <input
              type="text"
              value={studentForm.phone}
              onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              placeholder="01712345678"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Address</label>
            <input
              type="text"
              value={studentForm.address}
              onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              placeholder="Address"
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddNoticeModal}
        onClose={() => setShowAddNoticeModal(false)}
        title="Post New Notice"
        footer={
          <>
            <button
              onClick={() => setShowAddNoticeModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNotice}
              className="px-4 py-2 bg-[#F57C00] text-white rounded-xl text-sm font-medium hover:bg-[#F57C00]/90"
            >
              Post Notice
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Title *</label>
            <input
              type="text"
              value={noticeForm.title}
              onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              placeholder="Notice title"
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Content</label>
            <textarea
              rows={4}
              value={noticeForm.body}
              onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00] resize-none"
              placeholder="Notice content..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddTeacherModal || showEditTeacherModal}
        onClose={() => { setShowAddTeacherModal(false); setShowEditTeacherModal(false); setSelectedTeacher(null) }}
        title={showEditTeacherModal ? 'Edit Teacher' : 'Add New Teacher'}
        footer={
          <>
            <button onClick={() => { setShowAddTeacherModal(false); setShowEditTeacherModal(false); setSelectedTeacher(null) }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">Cancel</button>
            <button onClick={showEditTeacherModal ? handleEditTeacher : handleAddTeacher} className="px-4 py-2 bg-[#0f2040] text-white rounded-xl text-sm font-medium">
              {showEditTeacherModal ? 'Update' : 'Add'} Teacher
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Full Name *</label>
            <input type="text" value={teacherForm.name} onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" placeholder="Prof. John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Email</label>
              <input type="email" value={teacherForm.email} onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" placeholder="teacher@uist.edu" />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Phone</label>
              <input type="text" value={teacherForm.phone} onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" placeholder="01712345678" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Designation</label>
              <input type="text" value={teacherForm.designation} onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]" placeholder="Professor & Head" />
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Department</label>
              <select value={teacherForm.department} onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]">
                <option value="CSE">CSE</option>
                <option value="EEE">EEE</option>
                <option value="BBA">BBA</option>
                <option value="CE">Civil</option>
                <option value="ME">Mechanical</option>
                <option value="TE">Textile</option>
                <option value="AE">Automobile</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteTeacherModal}
        onClose={() => { setShowDeleteTeacherModal(false); setDeleteTeacherConfirm(''); setSelectedTeacher(null) }}
        title="Delete Teacher"
        footer={
          <>
            <button onClick={() => { setShowDeleteTeacherModal(false); setDeleteTeacherConfirm(''); setSelectedTeacher(null) }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">Cancel</button>
            <button onClick={handleDeleteTeacher} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Delete</button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">Are you sure you want to delete <strong>{selectedTeacher?.full_name}</strong>? This action cannot be undone.</p>
          <div>
            <label className="text-sm text-gray-500 block mb-1">Type teacher name to confirm</label>
            <input type="text" value={deleteTeacherConfirm} onChange={(e) => setDeleteTeacherConfirm(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-500" placeholder={selectedTeacher?.full_name} />
          </div>
        </div>
      </Modal>

      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  )
}
