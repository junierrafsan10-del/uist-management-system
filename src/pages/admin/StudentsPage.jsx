import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DashboardLayout from '../../layouts/DashboardLayout'
import Modal from '../../components/shared/Modal'
import Toast, { useToast } from '../../components/shared/Toast'
import { supabase } from '../../lib/supabase'

const ROWS_PER_PAGE = 20

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  graduated: 'bg-blue-100 text-blue-700',
}

export default function StudentsPage() {
  const [activeTab, setActiveTab] = useState('students')
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const setLoading = useState(true)[1]
  const { toasts, addToast, removeToast } = useToast()

  const [search, setSearch] = useState('')
  const [filterCourse, setFilterCourse] = useState('')
  const [filterBatch, setFilterBatch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [sortField, setSortField] = useState('student_id')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState([])

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')

  const [studentForm, setStudentForm] = useState({
    student_id: '', name: '', email: '', phone: '', course: '', batch: '', status: 'active'
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        supabase.from('students').select('*'),
        supabase.from('courses').select('name').eq('is_active', true),
      ])

      const mappedStudents = (studentsRes.data || []).map(s => ({
        ...s,
        name: s.full_name,
      }))
      setStudents(mappedStudents)
      setCourses(coursesRes.data?.map(c => c.name) || [])
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
    let result = [...students]
    
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(st => 
        st.name?.toLowerCase().includes(s) || 
        st.student_id?.toLowerCase().includes(s) ||
        st.course?.toLowerCase().includes(s)
      )
    }
    if (filterCourse) result = result.filter(st => st.course === filterCourse)
    if (filterBatch) result = result.filter(st => st.batch === filterBatch)
    if (filterStatus) result = result.filter(st => st.status === filterStatus)

    result.sort((a, b) => {
      const aVal = a[sortField] || ''
      const bVal = b[sortField] || ''
      const cmp = aVal.localeCompare(bVal)
      return sortOrder === 'asc' ? cmp : -cmp
    })

    return result
  }, [students, search, filterCourse, filterBatch, filterStatus, sortField, sortOrder])

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE
    return filteredStudents.slice(start, start + ROWS_PER_PAGE)
  }, [filteredStudents, currentPage])

  const totalPages = Math.ceil(filteredStudents.length / ROWS_PER_PAGE)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleSelectAll = () => {
    if (selectedRows.length === paginatedStudents.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(paginatedStudents.map(s => s.student_id))
    }
  }

  const handleSelectRow = (id) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    )
  }

  const handleAddStudent = async () => {
    try {
      if (!studentForm.student_id || !studentForm.name) {
        addToast('Student ID and Name are required', 'warning')
        return
      }

      const { error } = await supabase.from('students').insert({
        student_id: studentForm.student_id,
        full_name: studentForm.name,
        email: studentForm.email,
        phone: studentForm.phone,
        course: studentForm.course,
        batch: studentForm.batch,
        status: studentForm.status,
      })

      if (error) throw error
      addToast('Student added successfully!', 'success')
      setShowAddModal(false)
      setStudentForm({ student_id: '', name: '', email: '', phone: '', course: '', batch: '', status: 'active' })
      fetchData()
    } catch {
      addToast('Failed to add student', 'error')
    }
  }

  const handleEditStudent = async () => {
    try {
      const { error } = await supabase.from('students').update({
        full_name: studentForm.name,
        email: studentForm.email,
        phone: studentForm.phone,
        course: studentForm.course,
        batch: studentForm.batch,
        status: studentForm.status,
      }).eq('student_id', studentForm.student_id)

      if (error) throw error
      addToast('Student updated successfully!', 'success')
      setShowEditModal(false)
      fetchData()
    } catch {
      addToast('Failed to update student', 'error')
    }
  }

  const handleDeleteStudent = async () => {
    if (deleteConfirmName !== selectedStudent?.name) {
      addToast('Type student name to confirm', 'warning')
      return
    }
    try {
      const { error } = await supabase.from('students').delete().eq('student_id', selectedStudent.student_id)
      if (error) throw error
      addToast('Student deleted!', 'success')
      setShowDeleteModal(false)
      setSelectedStudent(null)
      setDeleteConfirmName('')
      fetchData()
    } catch {
      addToast('Failed to delete student', 'error')
    }
  }

  const exportStudentsToExcel = () => {
    const csv = [
      ['Student ID', 'Name', 'Email', 'Phone', 'Course', 'Batch', 'Status'],
      ...filteredStudents.map(s => [s.student_id, s.name, s.email, s.phone, s.course, s.batch, s.status])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students.csv'
    a.click()
    addToast('Excel exported!', 'success')
  }

  const openEdit = (student) => {
    setStudentForm(student)
    setShowEditModal(true)
  }

  const openDelete = (student) => {
    setSelectedStudent(student)
    setShowDeleteModal(true)
  }

  const openView = (student) => {
    setSelectedStudent(student)
    setShowDrawer(true)
  }

  const batches = [...new Set(students.map(s => s.batch).filter(Boolean))]

  return (
    <>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3 flex-1">
              <input
                type="text"
                placeholder="Search by name, ID, course..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00] w-full lg:w-64"
              />
              <select
                value={filterCourse}
                onChange={(e) => { setFilterCourse(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
              >
                <option value="">All Courses</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filterBatch}
                onChange={(e) => { setFilterBatch(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
              >
                <option value="">All Batches</option>
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-[#F57C00] text-white rounded-xl text-sm font-medium hover:bg-[#F57C00]/90"
              >
                + Add Student
              </button>
              <button
                onClick={exportStudentsToExcel}
                className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600"
              >
                Export Excel
              </button>
            </div>
          </div>

          {selectedRows.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-4"
            >
              <span className="text-sm font-medium text-orange-800">{selectedRows.length} selected</span>
              <button
                onClick={() => { setSelectedRows([]) }}
                className="text-sm text-orange-600 hover:underline"
              >
                Clear
              </button>
              <button
                onClick={() => addToast('Bulk delete coming soon', 'info')}
                className="text-sm text-red-600 hover:underline"
              >
                Delete Selected
              </button>
            </motion.div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === paginatedStudents.length && paginatedStudents.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-[#F57C00]" onClick={() => handleSort('student_id')}>
                      Student ID {sortField === 'student_id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-[#F57C00]" onClick={() => handleSort('name')}>
                      Full Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-[#F57C00]" onClick={() => handleSort('course')}>
                      Course {sortField === 'course' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 font-medium cursor-pointer hover:text-[#F57C00]" onClick={() => handleSort('batch')}>
                      Batch {sortField === 'batch' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedStudents.map((student, i) => (
                    <motion.tr
                      key={student.student_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(student.student_id)}
                          onChange={() => handleSelectRow(student.student_id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600">{student.student_id}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{student.name}</td>
                      <td className="px-4 py-3 text-gray-600">{student.course}</td>
                      <td className="px-4 py-3 text-gray-600">{student.batch}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[student.status] || STATUS_COLORS.active}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button onClick={() => openView(student)} className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200" title="View">👁️</button>
                          <button onClick={() => openEdit(student)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Edit">✏️</button>
                          <button onClick={() => openDelete(student)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Delete">🗑️</button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * ROWS_PER_PAGE + 1} to {Math.min(currentPage * ROWS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length}
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg text-sm ${currentPage === page ? 'bg-[#F57C00] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showAddModal || showEditModal}
          onClose={() => { setShowAddModal(false); setShowEditModal(false); setStudentForm({ student_id: '', name: '', email: '', phone: '', course: '', batch: '', status: 'active' }) }}
          title={showEditModal ? 'Edit Student' : 'Add New Student'}
          footer={
            <>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false) }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={showEditModal ? handleEditStudent : handleAddStudent} className="px-4 py-2 bg-[#0f2040] text-white rounded-xl text-sm font-medium">
                {showEditModal ? 'Update' : 'Add'} Student
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Student ID *</label>
                <input
                  type="text"
                  value={studentForm.student_id}
                  onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                  placeholder="ST-001"
                  disabled={showEditModal}
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Full Name *</label>
                <input
                  type="text"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                  placeholder="John Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Course</label>
                <select
                  value={studentForm.course}
                  onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Batch</label>
                <input
                  type="text"
                  value={studentForm.batch}
                  onChange={(e) => setStudentForm({ ...studentForm, batch: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                  placeholder="2024"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Email</label>
                <input
                  type="email"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                  placeholder="email@example.com"
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
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Status</label>
              <select
                value={studentForm.status}
                onChange={(e) => setStudentForm({ ...studentForm, status: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="graduated">Graduated</option>
              </select>
            </div>
          </div>
        </Modal>

        {/* Delete Modal */}
        <Modal
          isOpen={showDeleteModal}
          onClose={() => { setShowDeleteModal(false); setDeleteConfirmName(''); setSelectedStudent(null) }}
          title="Delete Student"
          footer={
            <>
              <button onClick={() => { setShowDeleteModal(false); setDeleteConfirmName('') }} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleDeleteStudent} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Delete</button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-gray-600">Are you sure you want to delete <strong>{selectedStudent?.name}</strong>? This action cannot be undone.</p>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Type student name to confirm</label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-red-500"
                placeholder={selectedStudent?.name}
              />
            </div>
          </div>
        </Modal>

        {/* View Drawer */}
        <AnimatePresence>
          {showDrawer && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40"
                onClick={() => setShowDrawer(false)}
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Student Details</h2>
                    <button onClick={() => setShowDrawer(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-[#0f2040] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {selectedStudent?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{selectedStudent?.name}</h3>
                      <p className="text-sm text-gray-500">{selectedStudent?.student_id}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Course</span>
                      <span className="font-medium text-gray-800">{selectedStudent?.course}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Batch</span>
                      <span className="font-medium text-gray-800">{selectedStudent?.batch}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Email</span>
                      <span className="font-medium text-gray-800">{selectedStudent?.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Phone</span>
                      <span className="font-medium text-gray-800">{selectedStudent?.phone}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-500">Status</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedStudent?.status]}`}>
                        {selectedStudent?.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-800 mb-3">Attendance</h4>
                    <div className="flex items-center justify-center">
                      <div className="relative w-24 h-24">
                        <svg className="w-24 h-24 -rotate-90">
                          <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                          <circle cx="48" cy="48" r="40" fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="50" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800">80%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <Toast toasts={toasts} removeToast={removeToast} />
      </DashboardLayout>
    </>
  )
}
