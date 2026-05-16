import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import DashboardLayout from '../../layouts/DashboardLayout'
import Modal from '../../components/shared/Modal'
import Toast, { useToast } from '../../components/shared/Toast'
import { supabase } from '../../lib/supabase'

const GRADE_COLORS = {
  'A+': 'bg-green-700 text-white',
  A: 'bg-green-500 text-white',
  B: 'bg-blue-500 text-white',
  C: 'bg-orange-500 text-white',
  D: 'bg-yellow-400 text-white',
  F: 'bg-red-500 text-white',
}

const calculateGrade = (percentage) => {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}

const getGradePoints = (grade) => {
  switch (grade) {
    case 'A+': return 4.0
    case 'A': return 3.75
    case 'B': return 3.5
    case 'C': return 3.0
    case 'D': return 2.0
    default: return 0
  }
}

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState('results')
  const [results, setResults] = useState([])
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const setLoading = useState(true)[1]
  const { toasts, addToast, removeToast } = useToast()

  const [filterCourse, setFilterCourse] = useState('')
  const [filterSemester, setFilterSemester] = useState('')
  const [filterExamType, setFilterExamType] = useState('')
  const [filterYear, setFilterYear] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [resultForm, setResultForm] = useState({
    student_id: '', course: '', exam_type: 'midterm', marks_obtained: '', total_marks: '', year: '2025'
  })

  const [calculatedGrade, setCalculatedGrade] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resultsRes, studentsRes, coursesRes] = await Promise.all([
        supabase.from('results').select('*'),
        supabase.from('students').select('student_id, full_name'),
        supabase.from('courses').select('name').eq('is_active', true),
      ])

      const studentMap = {}
      ;(studentsRes.data || []).forEach(s => {
        studentMap[s.student_id] = s.full_name
      })

      const mappedResults = (resultsRes.data || []).map(r => ({
        ...r,
        student_name: studentMap[r.student_id] || r.student_id,
        course: r.subject_name,
        total: 100,
        marks: r.marks,
      }))

      setResults(mappedResults)
      setStudents(studentsRes.data || [])
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

  useEffect(() => {
    if (resultForm.marks_obtained && resultForm.total_marks) {
      const percentage = (parseFloat(resultForm.marks_obtained) / parseFloat(resultForm.total_marks)) * 100
      setCalculatedGrade(calculateGrade(percentage))
    } else {
      setCalculatedGrade('')
    }
  }, [resultForm.marks_obtained, resultForm.total_marks])

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (filterCourse && r.course !== filterCourse) return false
      if (filterExamType && r.exam_type !== filterExamType) return false
      if (filterYear && r.year !== filterYear) return false
      return true
    })
  }, [results, filterCourse, filterExamType, filterYear])

  const handleAddResult = async () => {
    if (!resultForm.student_id || !resultForm.marks_obtained || !resultForm.total_marks) {
      addToast('Please fill all required fields', 'warning')
      return
    }

    const percentage = (parseFloat(resultForm.marks_obtained) / parseFloat(resultForm.total_marks)) * 100
    const grade = calculateGrade(percentage)
    const student = students.find(s => s.student_id === resultForm.student_id)

    try {
      const { error } = await supabase.from('results').insert({
        student_id: resultForm.student_id,
        subject_name: resultForm.course || student?.course || '',
        exam_type: resultForm.exam_type,
        marks: parseFloat(resultForm.marks_obtained),
        grade: grade,
        grade_points: getGradePoints(grade),
        credits: 3,
        semester: 1,
      })

      if (error) throw error
      addToast('Result added successfully!', 'success')
      setShowAddModal(false)
      setResultForm({ student_id: '', course: '', exam_type: 'midterm', marks_obtained: '', total_marks: '', year: '2025' })
      fetchData()
    } catch {
      addToast('Failed to add result', 'error')
    }
  }

  const exportToPDF = () => {
    addToast('Exporting PDF...', 'info')
    setTimeout(() => {
      const content = filteredResults.map(r => ({
        'Student Name': r.student_name,
        'Student ID': r.student_id,
        'Course': r.course,
        'Exam Type': r.exam_type,
        'Marks': `${r.marks}/${r.total}`,
        'Percentage': `${((r.marks / r.total) * 100).toFixed(1)}%`,
        'Grade': r.grade,
      }))
      
      let csv = 'Student Name,Student ID,Course,Exam Type,Marks,Percentage,Grade\n'
      content.forEach(row => {
        csv += `${row['Student Name']},${row['Student ID']},${row['Course']},${row['Exam Type']},${row['Marks']},${row['Percentage']},${row['Grade']}\n`
      })
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'results.pdf'
      a.click()
      addToast('Results exported!', 'success')
    }, 1000)
  }

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8]
  const examTypes = ['midterm', 'final', 'assignment', 'quiz']
  const years = ['2025', '2024', '2023', '2022']

  return (
    <>
      <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
              >
                <option value="">All Courses</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
              >
                <option value="">All Semesters</option>
                {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
              <select
                value={filterExamType}
                onChange={(e) => setFilterExamType(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
              >
                <option value="">All Exam Types</option>
                {examTypes.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none"
              >
                <option value="">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-[#F57C00] text-white rounded-xl text-sm font-medium hover:bg-[#F57C00]/90"
              >
                + Add Result
              </button>
              <button
                onClick={exportToPDF}
                className="px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600"
              >
                Export Results PDF
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-medium">Student Name</th>
                    <th className="px-4 py-3 font-medium">Student ID</th>
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Exam Type</th>
                    <th className="px-4 py-3 text-center font-medium">Marks</th>
                    <th className="px-4 py-3 text-center font-medium">Total</th>
                    <th className="px-4 py-3 text-center font-medium">Percentage</th>
                    <th className="px-4 py-3 text-center font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredResults.map((result, i) => {
                    const total = result.total || 100
                    const percentage = result.marks && total ? ((result.marks / total) * 100).toFixed(1) : 0
                    const grade = result.grade || calculateGrade(parseFloat(percentage))
                    return (
                      <motion.tr
                        key={result.id || i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">{result.student_name}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono">{result.student_id}</td>
                        <td className="px-4 py-3 text-gray-600">{result.course}</td>
                        <td className="px-4 py-3 text-gray-600 capitalize">{result.exam_type}</td>
                        <td className="px-4 py-3 text-center text-gray-800 font-medium">{result.marks}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{result.total || 100}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{percentage}%</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${GRADE_COLORS[grade] || 'bg-gray-100 text-gray-600'}`}>
                            {grade}
                          </span>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredResults.length === 0 && (
              <div className="p-8 text-center text-gray-500">No results found</div>
            )}
          </div>
        </div>

        <Modal
          isOpen={showAddModal}
          onClose={() => { setShowAddModal(false); setResultForm({ student_id: '', course: '', exam_type: 'midterm', marks_obtained: '', total_marks: '', year: '2025' }) }}
          title="Add New Result"
          footer={
            <>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">Cancel</button>
              <button onClick={handleAddResult} className="px-4 py-2 bg-[#0f2040] text-white rounded-xl text-sm font-medium">Add Result</button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 block mb-1">Student *</label>
              <select
                value={resultForm.student_id}
                onChange={(e) => {
                  const st = students.find(s => s.student_id === e.target.value)
                  setResultForm({ ...resultForm, student_id: e.target.value, course: st?.course || '' })
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              >
                <option value="">Select Student</option>
                {students.map(s => <option key={s.student_id} value={s.student_id}>{s.full_name} ({s.student_id})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Course</label>
                <select
                  value={resultForm.course}
                  onChange={(e) => setResultForm({ ...resultForm, course: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                >
                  <option value="">Select Course</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Exam Type</label>
                <select
                  value={resultForm.exam_type}
                  onChange={(e) => setResultForm({ ...resultForm, exam_type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                >
                  {examTypes.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500 block mb-1">Marks Obtained *</label>
                <input
                  type="number"
                  value={resultForm.marks_obtained}
                  onChange={(e) => setResultForm({ ...resultForm, marks_obtained: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                  placeholder="85"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 block mb-1">Total Marks *</label>
                <input
                  type="number"
                  value={resultForm.total_marks}
                  onChange={(e) => setResultForm({ ...resultForm, total_marks: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
                  placeholder="100"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-1">Year</label>
              <select
                value={resultForm.year}
                onChange={(e) => setResultForm({ ...resultForm, year: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#F57C00]"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {calculatedGrade && (
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500 mb-1">Calculated Grade</p>
                <span className={`inline-block px-4 py-2 rounded-lg text-lg font-bold ${GRADE_COLORS[calculatedGrade]}`}>
                  {calculatedGrade}
                </span>
              </div>
            )}
          </div>
        </Modal>

        <Toast toasts={toasts} removeToast={removeToast} />
      </DashboardLayout>
    </>
  )
}
