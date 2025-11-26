-- Alternative: More permissive policy for troubleshooting
-- If the previous migration works, you don't need to run this one
-- This allows any authenticated user to upload to avatars bucket

-- Drop the restrictive policy if it exists
drop policy if exists "Users can upload their own avatar" on storage.objects;

-- Create a more permissive upload policy (for testing)
-- WARNING: This is less secure but helps diagnose RLS issues
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');
