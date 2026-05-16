-- ============================================================================
-- FINAL PRODUCTION MIGRATION
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================================

-- 0. DROP EXISTING TABLES (safe to re-run)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS fees CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS notices CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS user_role;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. PROFILES (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 4. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COURSES
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  duration_years INTEGER DEFAULT 4,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  credits INTEGER NOT NULL DEFAULT 3,
  semester INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT UNIQUE NOT NULL,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  batch TEXT,
  year TEXT,
  semester INTEGER DEFAULT 1,
  phone TEXT,
  address TEXT,
  course TEXT,
  cgpa NUMERIC(4,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  enrolled_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. FACULTY
CREATE TABLE IF NOT EXISTS faculty (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  designation TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. RESULTS
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  subject_name TEXT NOT NULL,
  credits INTEGER NOT NULL DEFAULT 3,
  semester INTEGER NOT NULL,
  marks NUMERIC(5,2) NOT NULL CHECK (marks >= 0 AND marks <= 100),
  grade TEXT,
  grade_points NUMERIC(3,1),
  exam_type TEXT DEFAULT 'final' CHECK (exam_type IN ('midterm', 'final', 'quiz', 'assignment')),
  evaluated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  subject_name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for attendance upsert
ALTER TABLE attendance ADD CONSTRAINT attendance_student_subject_date_unique UNIQUE (student_id, subject_name, date);

-- 11. FEES
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id TEXT REFERENCES students(student_id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  paid NUMERIC(10,2) DEFAULT 0 CHECK (paid >= 0),
  due_date DATE,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('paid', 'partial', 'unpaid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. NOTICES
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT,
  category TEXT DEFAULT 'Notice' CHECK (category IN ('Academic', 'Event', 'Notice', 'Urgent', 'Admission', 'Exam')),
  is_published BOOLEAN DEFAULT false,
  posted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. INDEXES
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id);
CREATE INDEX IF NOT EXISTS idx_results_semester ON results(semester);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_fees_student ON fees(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices(is_published);
CREATE INDEX IF NOT EXISTS idx_notices_date ON notices(date DESC);
CREATE INDEX IF NOT EXISTS idx_subjects_course_semester ON subjects(course_id, semester);

-- 14. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- 15. RLS HELPER
CREATE OR REPLACE FUNCTION get_current_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::TEXT FROM profiles WHERE id = auth.uid()
$$;

-- 16. RLS POLICIES

-- PROFILES
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can read all profiles" ON profiles;
CREATE POLICY "Admin can read all profiles" ON profiles
  FOR SELECT USING (get_current_role() = 'admin');

DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;
CREATE POLICY "Admin can update profiles" ON profiles
  FOR UPDATE USING (get_current_role() = 'admin');

-- STUDENTS
DROP POLICY IF EXISTS "Admin full access to students" ON students;
CREATE POLICY "Admin full access to students" ON students
  FOR ALL USING (get_current_role() = 'admin');

DROP POLICY IF EXISTS "Students can read own" ON students;
CREATE POLICY "Students can read own" ON students
  FOR SELECT USING (profile_id = auth.uid() OR email = auth.email());

DROP POLICY IF EXISTS "Teachers can read students" ON students;
CREATE POLICY "Teachers can read students" ON students
  FOR SELECT USING (get_current_role() = 'teacher');

-- FACULTY
DROP POLICY IF EXISTS "Admin full access to faculty" ON faculty;
CREATE POLICY "Admin full access to faculty" ON faculty
  FOR ALL USING (get_current_role() = 'admin');

DROP POLICY IF EXISTS "Teachers can read own faculty" ON faculty;
CREATE POLICY "Teachers can read own faculty" ON faculty
  FOR SELECT USING (auth.uid() = profile_id OR get_current_role() = 'teacher');

DROP POLICY IF EXISTS "Students can read faculty" ON faculty;
CREATE POLICY "Students can read faculty" ON faculty
  FOR SELECT USING (get_current_role() = 'student');

-- RESULTS
DROP POLICY IF EXISTS "Admin full access to results" ON results;
CREATE POLICY "Admin full access to results" ON results
  FOR ALL USING (get_current_role() = 'admin');

DROP POLICY IF EXISTS "Teachers can insert results" ON results;
CREATE POLICY "Teachers can insert results" ON results
  FOR INSERT WITH CHECK (get_current_role() IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Teachers can update results" ON results;
CREATE POLICY "Teachers can update results" ON results
  FOR UPDATE USING (get_current_role() IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Students can read own results" ON results;
CREATE POLICY "Students can read own results" ON results
  FOR SELECT USING (
    student_id IN (SELECT student_id FROM students WHERE profile_id = auth.uid())
    OR get_current_role() IN ('teacher', 'admin')
  );

-- ATTENDANCE
DROP POLICY IF EXISTS "Admin full access to attendance" ON attendance;
CREATE POLICY "Admin full access to attendance" ON attendance
  FOR ALL USING (get_current_role() = 'admin');

DROP POLICY IF EXISTS "Teachers can insert attendance" ON attendance;
CREATE POLICY "Teachers can insert attendance" ON attendance
  FOR INSERT WITH CHECK (get_current_role() IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Teachers can update attendance" ON attendance;
CREATE POLICY "Teachers can update attendance" ON attendance
  FOR UPDATE USING (get_current_role() IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Students can read own attendance" ON attendance;
CREATE POLICY "Students can read own attendance" ON attendance
  FOR SELECT USING (
    student_id IN (SELECT student_id FROM students WHERE profile_id = auth.uid())
    OR get_current_role() IN ('teacher', 'admin')
  );

-- FEES
DROP POLICY IF EXISTS "Admin full access to fees" ON fees;
CREATE POLICY "Admin full access to fees" ON fees
  FOR ALL USING (get_current_role() = 'admin');

DROP POLICY IF EXISTS "Students can read own fees" ON fees;
CREATE POLICY "Students can read own fees" ON fees
  FOR SELECT USING (
    student_id IN (SELECT student_id FROM students WHERE profile_id = auth.uid())
    OR get_current_role() = 'admin'
  );

-- NOTICES
DROP POLICY IF EXISTS "Admin full access to notices" ON notices;
CREATE POLICY "Admin full access to notices" ON notices
  FOR ALL USING (get_current_role() = 'admin');

DROP POLICY IF EXISTS "Teachers can insert notices" ON notices;
CREATE POLICY "Teachers can insert notices" ON notices
  FOR INSERT WITH CHECK (get_current_role() IN ('teacher', 'admin'));

DROP POLICY IF EXISTS "Teachers can update own notices" ON notices;
CREATE POLICY "Teachers can update own notices" ON notices
  FOR UPDATE USING (auth.uid() = posted_by OR get_current_role() = 'admin');

DROP POLICY IF EXISTS "Anyone can read published notices" ON notices;
CREATE POLICY "Anyone can read published notices" ON notices
  FOR SELECT USING (is_published = true OR get_current_role() IN ('admin', 'teacher'));

-- DEPARTMENTS
DROP POLICY IF EXISTS "Anyone can read departments" ON departments;
CREATE POLICY "Anyone can read departments" ON departments
  FOR SELECT TO authenticated USING (true);

-- COURSES
DROP POLICY IF EXISTS "Anyone can read courses" ON courses;
CREATE POLICY "Anyone can read courses" ON courses
  FOR SELECT TO authenticated USING (true);

-- SUBJECTS
DROP POLICY IF EXISTS "Anyone can read subjects" ON subjects;
CREATE POLICY "Anyone can read subjects" ON subjects
  FOR SELECT TO authenticated USING (true);

-- 17. SEED DATA
INSERT INTO departments (code, name) VALUES
  ('CSE', 'Computer Science and Technology'),
  ('EEE', 'Electrical and Electronic Engineering'),
  ('BBA', 'Bachelor of Business Administration'),
  ('CE', 'Civil Engineering'),
  ('ME', 'Mechanical Engineering'),
  ('TE', 'Textile Engineering'),
  ('AE', 'Automobile Engineering')
ON CONFLICT (code) DO NOTHING;

INSERT INTO courses (department_id, name, code) VALUES
  ((SELECT id FROM departments WHERE code = 'CSE'), 'Computer Science and Technology', 'CST'),
  ((SELECT id FROM departments WHERE code = 'EEE'), 'Electrical Engineering', 'EE'),
  ((SELECT id FROM departments WHERE code = 'BBA'), 'Bachelor of Business Administration', 'BBA'),
  ((SELECT id FROM departments WHERE code = 'CE'), 'Civil Technology', 'CT'),
  ((SELECT id FROM departments WHERE code = 'ME'), 'Mechanical Engineering', 'ME'),
  ((SELECT id FROM departments WHERE code = 'TE'), 'Textile Engineering', 'TE'),
  ((SELECT id FROM departments WHERE code = 'AE'), 'Automobile Engineering', 'AE')
ON CONFLICT (code) DO NOTHING;

INSERT INTO subjects (course_id, name, credits, semester) VALUES
  ((SELECT id FROM courses WHERE code = 'CST'), 'Mathematics I', 4, 1),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Programming Fundamentals', 4, 1),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Digital Logic', 3, 1),
  ((SELECT id FROM courses WHERE code = 'CST'), 'English', 2, 1),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Physics', 3, 1),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Mathematics II', 4, 2),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Data Structures', 4, 2),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Discrete Mathematics', 3, 2),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Computer Organization', 3, 2),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Electronics', 3, 2),
  ((SELECT id FROM courses WHERE code = 'CST'), 'OOP', 4, 3),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Database Systems', 4, 3),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Operating Systems', 3, 3),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Networks', 3, 3),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Software Engineering', 3, 3),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Algorithms', 4, 4),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Web Technologies', 4, 4),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Machine Learning', 3, 4),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Compiler Design', 3, 4),
  ((SELECT id FROM courses WHERE code = 'CST'), 'Security', 3, 4)
ON CONFLICT DO NOTHING;

INSERT INTO faculty (full_name, email, designation, department_id) VALUES
  ('Prof. Kamal Hossain', 'kamal@uist.edu', 'Professor & Head', (SELECT id FROM departments WHERE code = 'CSE')),
  ('Dr. Farzana Akhter', 'farzana@uist.edu', 'Associate Professor', (SELECT id FROM departments WHERE code = 'EEE')),
  ('Mr. Shahidul Islam', 'shahidul@uist.edu', 'Assistant Professor', (SELECT id FROM departments WHERE code = 'BBA')),
  ('Dr. Mahmuda Begum', 'mahmuda@uist.edu', 'Professor', (SELECT id FROM departments WHERE code = 'CE')),
  ('Ms. Tahmina Karim', 'tahmina.k@uist.edu', 'Lecturer', (SELECT id FROM departments WHERE code = 'CSE'))
ON CONFLICT DO NOTHING;

INSERT INTO students (student_id, department_id, full_name, email, course, batch, year, semester, phone, address, status) VALUES
  ('S1001', (SELECT id FROM departments WHERE code = 'CSE'), 'Arif Hossain', 'arif@uist.edu', 'Computer Science and Technology', '2024', '3rd', 5, '01711111111', 'Dhaka', 'active'),
  ('S1002', (SELECT id FROM departments WHERE code = 'EEE'), 'Fatima Begum', 'fatima@uist.edu', 'Electrical and Electronic Engineering', '2024', '2nd', 3, '01711111112', 'Chittagong', 'active'),
  ('S1003', (SELECT id FROM departments WHERE code = 'BBA'), 'Tanvir Ahmed', 'tanvir@uist.edu', 'Bachelor of Business Administration', '2024', '4th', 7, '01711111113', 'Sylhet', 'active'),
  ('S1004', (SELECT id FROM departments WHERE code = 'CE'), 'Nusrat Jahan', 'nusrat@uist.edu', 'Civil Technology', '2024', '3rd', 5, '01711111114', 'Rajshahi', 'active'),
  ('S1005', (SELECT id FROM departments WHERE code = 'CSE'), 'Mahbub Karim', 'mahbub@uist.edu', 'Computer Science and Technology', '2024', '1st', 1, '01711111115', 'Khulna', 'active'),
  ('S1006', (SELECT id FROM departments WHERE code = 'EEE'), 'Shamim Reza', 'shamim@uist.edu', 'Electrical and Electronic Engineering', '2024', '3rd', 5, '01711111116', 'Barisal', 'active'),
  ('S1007', (SELECT id FROM departments WHERE code = 'BBA'), 'Jannatul Ferdous', 'jannatul@uist.edu', 'Bachelor of Business Administration', '2024', '2nd', 3, '01711111117', 'Dhaka', 'active'),
  ('S1008', (SELECT id FROM departments WHERE code = 'CE'), 'Hasan Mahmud', 'hasan@uist.edu', 'Civil Technology', '2024', '4th', 7, '01711111118', 'Comilla', 'active'),
  ('S1009', (SELECT id FROM departments WHERE code = 'CSE'), 'Tahmina Akhter', 'tahmina@uist.edu', 'Computer Science and Technology', '2024', '2nd', 3, '01711111119', 'Mymensingh', 'active'),
  ('S1010', (SELECT id FROM departments WHERE code = 'BBA'), 'Rafiul Islam', 'rafiul@uist.edu', 'Bachelor of Business Administration', '2024', '1st', 1, '01711111120', 'Rangpur', 'active')
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO notices (title, body, category, is_published, date) VALUES
  ('Semester Final Exam Schedule', 'End semester examinations will begin from June 10, 2025. Detailed timetable available on the portal.', 'Academic', true, '2025-04-01'),
  ('Tech Fest 2025 — Register Now', 'Annual inter-university tech fest. Prizes worth Tk. 2,00,000. Register by May 15.', 'Event', true, '2025-03-20'),
  ('Library Extended Hours', 'Library open until 11 PM during exam season starting next week.', 'Notice', true, '2025-03-15'),
  ('Internship Opportunity', 'Google Summer of Code 2025 — interested students contact the CSE department office.', 'Academic', true, '2025-03-10'),
  ('Campus Placement Drive', 'Top recruiters visiting campus in June. Register your interest by May 1.', 'Event', true, '2025-03-05')
ON CONFLICT DO NOTHING;
