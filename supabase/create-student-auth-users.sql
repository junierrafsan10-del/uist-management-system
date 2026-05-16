-- ============================================================================
-- CREATE AUTH USERS FOR ALL SEED STUDENTS
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- Password for all students: Student@123
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  new_id UUID;
  created_count INTEGER := 0;
  skipped_count INTEGER := 0;
BEGIN
  FOR r IN SELECT * FROM students WHERE email IS NOT NULL AND email != ''
  LOOP
    -- Skip users that already have auth accounts
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = r.email) THEN
      skipped_count := skipped_count + 1;
      RAISE NOTICE 'SKIP (already exists): %', r.email;
      CONTINUE;
    END IF;

    new_id := gen_random_uuid();

    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, created_at, updated_at,
      instance_id, aud, role,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      new_id,
      r.email,
      crypt('Student@123', gen_salt('bf')),
      NOW(),
      jsonb_build_object('full_name', r.full_name, 'role', 'student'),
      NOW(), NOW(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      '', '', '', ''
    );

    -- The on_auth_user_created trigger auto-creates the profile row.
    -- Now link the student record to this profile.
    UPDATE students SET profile_id = new_id WHERE student_id = r.student_id;

    created_count := created_count + 1;
    RAISE NOTICE 'CREATED: % (id=%, student=%)', r.email, new_id, r.student_id;
  END LOOP;

  RAISE NOTICE 'Done. Created: %, Skipped: %', created_count, skipped_count;
END;
$$;

-- Verify results
SELECT
  s.student_id,
  s.full_name,
  s.email,
  s.profile_id IS NOT NULL AS has_profile_link,
  EXISTS (SELECT 1 FROM auth.users u WHERE u.email = s.email) AS has_auth_user,
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = s.profile_id) AS profile_exists
FROM students s
ORDER BY s.student_id;
