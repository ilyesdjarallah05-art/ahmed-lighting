-- Adds editable, multilingual 360° showroom tours to an existing Ahmed project.
create table if not exists public.virtual_tours (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 120),
  title_ar text not null default '', title_en text not null default '',
  description text not null default '' check (length(description) <= 3000),
  description_ar text not null default '', description_en text not null default '',
  location text not null default '', location_ar text not null default '', location_en text not null default '',
  cover_image text not null default '', active boolean not null default false, position integer not null default 0,
  scenes jsonb not null default '[]'::jsonb check (jsonb_typeof(scenes) = 'array' and jsonb_array_length(scenes) <= 60),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists virtual_tours_published on public.virtual_tours(position) where active;
alter table public.virtual_tours enable row level security;
drop policy if exists "Published virtual tours" on public.virtual_tours;
create policy "Published virtual tours" on public.virtual_tours for select to anon, authenticated using (active or (select public.is_store_admin()));
drop policy if exists "Admin virtual tours" on public.virtual_tours;
create policy "Admin virtual tours" on public.virtual_tours for all to authenticated using ((select public.is_store_admin())) with check ((select public.is_store_admin()));
revoke all on public.virtual_tours from anon, authenticated;
grant select on public.virtual_tours to anon, authenticated;
grant insert, update, delete on public.virtual_tours to authenticated;
grant all on public.virtual_tours to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('tour-panoramas','tour-panoramas',true,31457280,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "Public tour panoramas" on storage.objects;
create policy "Public tour panoramas" on storage.objects for select to anon, authenticated using (bucket_id = 'tour-panoramas');
drop policy if exists "Admin tour panorama uploads" on storage.objects;
create policy "Admin tour panorama uploads" on storage.objects for insert to authenticated with check (bucket_id = 'tour-panoramas' and (select public.is_store_admin()));
drop policy if exists "Admin tour panorama changes" on storage.objects;
create policy "Admin tour panorama changes" on storage.objects for update to authenticated using (bucket_id = 'tour-panoramas' and (select public.is_store_admin())) with check (bucket_id = 'tour-panoramas' and (select public.is_store_admin()));
drop policy if exists "Admin tour panorama removal" on storage.objects;
create policy "Admin tour panorama removal" on storage.objects for delete to authenticated using (bucket_id = 'tour-panoramas' and (select public.is_store_admin()));

create or replace function public.touch_virtual_tour_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists virtual_tours_updated_at on public.virtual_tours;
create trigger virtual_tours_updated_at before update on public.virtual_tours for each row execute function public.touch_virtual_tour_updated_at();
