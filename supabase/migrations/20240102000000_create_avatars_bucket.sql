-- Create avatars storage bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Enable RLS on storage.objects (if not already enabled)
alter table storage.objects enable row level security;

-- Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "Users can upload their own avatar" on storage.objects;
drop policy if exists "Users can update their own avatar" on storage.objects;
drop policy if exists "Users can delete their own avatar" on storage.objects;
drop policy if exists "Public avatars are viewable by everyone" on storage.objects;

-- Storage policies for avatars bucket

-- Allow authenticated users to upload avatars
-- Files are named as: {user_id}-{timestamp}.{ext}
-- We check that the filename starts with the user's ID
create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '-', 1) = auth.uid()::text
  );

-- Allow authenticated users to update their own avatars
create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars' 
    and (auth.uid()::text = split_part(name, '-', 1))
  )
  with check (
    bucket_id = 'avatars' 
    and (auth.uid()::text = split_part(name, '-', 1))
  );

-- Allow authenticated users to delete their own avatars
create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars' 
    and (auth.uid()::text = split_part(name, '-', 1))
  );

-- Allow public to view avatars (since bucket is public)
create policy "Public avatars are viewable by everyone"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');
