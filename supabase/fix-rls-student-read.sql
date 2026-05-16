-- ============================================================================
-- FIX: Students can now read their own record via profile_id
-- 
-- The old policy used: student_id = split_part(email, '@', 1)
-- This NEVER worked because student_id is like 'S1001' and the email prefix
-- is like 'arif' — they never match.
--
-- Fix: use profile_id = auth.uid() which links directly via the FK.
--
-- Also allows reading by email match for the dashboard query.
-- ============================================================================

DROP POLICY IF EXISTS "Students can read own" ON students;

CREATE POLICY "Students can read own" ON students
  FOR SELECT USING (
    profile_id = auth.uid() OR email = auth.email()
  );

-- Verify with an explain if needed
SELECT 'Policy updated successfully' AS status;
