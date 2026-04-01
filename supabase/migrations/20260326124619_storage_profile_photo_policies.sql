insert into storage.buckets (id, name, public)
values ('profile_photo', 'profile_photo', true)
on conflict (id) do nothing;


-- Allow authenticated users to upload
create policy "Allow authenticated uploads"
on storage.objects
for insert
to authenticated
with check (
  auth.uid() IS NOT NULL
  AND bucket_id = 'profile_photo'
);

-- Allow public read
create policy "Allow public read"
on storage.objects
for select
to public
using (
  bucket_id = 'profile_photo'
);

-- Allow users to update their own files
create policy "Allow users to update their files"
on storage.objects
for update
to authenticated
using (
  auth.uid() IS NOT NULL
  AND bucket_id = 'profile_photo'
);

-- Allow users to delete their own files
create policy "Allow users to delete their files"
on storage.objects
for delete
to authenticated
using (
  auth.uid() IS NOT NULL
  AND bucket_id = 'profile_photo'
);