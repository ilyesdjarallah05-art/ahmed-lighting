-- Run once in a NEW Supabase project's SQL editor. No dependency on the old store.
create extension if not exists pgcrypto;

create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
create function public.is_store_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_store_admin() from public;
grant execute on function public.is_store_admin() to anon, authenticated;

create table public.categories (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(name) between 1 and 60),
  name_ar text not null default '',
  name_en text not null default '',
  icon text not null default 'ceiling', position integer not null default 0
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  name_ar text not null default '',
  name_en text not null default '',
  sku text not null unique check (length(sku) between 1 and 50),
  category_id text not null references public.categories(id),
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price >= 0 and sale_price < price),
  stock integer not null default 0 check (stock >= 0),
  colors text[] not null check (cardinality(colors) between 1 and 20),
  temperatures text[] not null check (cardinality(temperatures) between 1 and 20),
  material text not null default '',
  material_ar text not null default '',
  material_en text not null default '',
  dimensions text not null default '', wattage text not null default '',
  description text not null default '' check (length(description) <= 3000),
  description_ar text not null default '',
  description_en text not null default '',
  image_off text not null check (length(image_off) > 0), image_on text not null default '',
  gallery text[] not null default '{}', active boolean not null default false, featured boolean not null default false,
  badge text not null default '',
  badge_ar text not null default '',
  badge_en text not null default '',
  created_at timestamptz not null default now()
);
create index products_category_active on public.products(category_id) where active;
create table public.site_settings (id integer primary key check (id = 1), data jsonb not null default '{}');
insert into public.site_settings(id, data) values (1, '{"store_name":"Ahmed","tagline":"L''éclairage, pensé pour vous.","currency":"DZD","locale":"fr-DZ"}');
insert into public.categories(id, name, name_ar, name_en, icon, position) values
  ('pendants','Suspensions','ثريات معلقة','Pendants','pendant',1),
  ('ceiling-lamps','Plafonniers','مصابيح سقف','Ceiling lamps','ceiling',2),
  ('table-lamps','Lampes à poser','مصابيح طاولة','Table lamps','table',3),
  ('floor-lamps','Lampadaires','مصابيح أرضية','Floor lamps','floor',4),
  ('spotlights','Spots orientables','أضواء سبوت','Spotlights','spotlight',5),
  ('downlights','Spots encastrés','أضواء سبوت غائرة','Downlights','downlight',6);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  reference text generated always as ('ZT-' || upper(substr(replace(id::text, '-', ''), 1, 10))) stored unique,
  request_id uuid not null unique,
  customer_name text not null, phone text not null, email text not null default '', city text not null,
  address text not null, notes text not null default '',
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  subtotal numeric(12,2) not null check (subtotal >= 0), currency text not null,
  status text not null default 'new' check (status in ('new','confirmed','completed','cancelled')),
  telegram_status text not null default 'pending' check (telegram_status in ('pending','sent','failed')),
  telegram_claimed_at timestamptz, ip_hash text not null, created_at timestamptz not null default now()
);
create index orders_phone_rate on public.orders(phone, created_at desc);
create index orders_ip_rate on public.orders(ip_hash, created_at desc);

create table public.virtual_tours (
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
create index virtual_tours_published on public.virtual_tours(position) where active;

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;
alter table public.orders enable row level security;
alter table public.virtual_tours enable row level security;
create policy "Read own admin membership" on public.admins for select to authenticated using (user_id = (select auth.uid()));
create policy "Public categories" on public.categories for select to anon, authenticated using (true);
create policy "Admin categories" on public.categories for all to authenticated using ((select public.is_store_admin())) with check ((select public.is_store_admin()));
create policy "Published products" on public.products for select to anon, authenticated using (active or (select public.is_store_admin()));
create policy "Admin products" on public.products for all to authenticated using ((select public.is_store_admin())) with check ((select public.is_store_admin()));
create policy "Public shop settings" on public.site_settings for select to anon, authenticated using (true);
create policy "Admin shop settings" on public.site_settings for update to authenticated using ((select public.is_store_admin())) with check ((select public.is_store_admin()));
create policy "Admin read orders" on public.orders for select to authenticated using ((select public.is_store_admin()));
create policy "Admin update order status" on public.orders for update to authenticated using ((select public.is_store_admin())) with check ((select public.is_store_admin()));
create policy "Published virtual tours" on public.virtual_tours for select to anon, authenticated using (active or (select public.is_store_admin()));
create policy "Admin virtual tours" on public.virtual_tours for all to authenticated using ((select public.is_store_admin())) with check ((select public.is_store_admin()));
revoke all on public.admins, public.categories, public.products, public.site_settings, public.orders, public.virtual_tours from anon, authenticated;
grant select on public.categories, public.products, public.site_settings to anon, authenticated;
grant select on public.admins, public.orders to authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant update(data) on public.site_settings to authenticated;
grant update(status) on public.orders to authenticated;
grant select on public.virtual_tours to anon, authenticated;
grant insert, update, delete on public.virtual_tours to authenticated;
grant all on public.admins, public.categories, public.products, public.site_settings, public.orders, public.virtual_tours to service_role;

-- Only the Edge Function may create orders. Prices and stock are calculated inside one transaction.
create function public.create_lighting_order(p_request_id uuid, p_customer jsonb, p_items jsonb, p_ip_hash text)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare result public.orders; p public.products; line jsonb; snapshots jsonb := '[]'; total numeric := 0; phone_value text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));
  select * into result from public.orders where request_id = p_request_id;
  if found then return result; end if;
  phone_value := regexp_replace(p_customer->>'phone', '[^0-9]', '', 'g');
  if length(phone_value) not between 7 and 20 or length(p_customer->>'customer_name') not between 2 and 100
    or length(p_customer->>'city') not between 2 and 100 or length(p_customer->>'address') not between 5 and 500 then
    raise exception 'Please check your contact and delivery details.';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Please review your basket.'; end if;
  perform pg_advisory_xact_lock(hashtextextended('ip:' || p_ip_hash, 0));
  perform pg_advisory_xact_lock(hashtextextended('phone:' || phone_value, 0));
  if (select count(*) from public.orders where phone = phone_value and created_at > now() - interval '1 hour') >= 5
    or (select count(*) from public.orders where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 8 then
    raise exception 'Too many requests. Please try again later or contact the store.';
  end if;
  -- Lock products in deterministic order, including quantities across different finishes.
  perform p0.id from public.products p0 where p0.id in (select (value->>'product_id')::uuid from jsonb_array_elements(p_items)) order by p0.id for update;
  for line in select value from jsonb_array_elements(p_items) loop
    select * into p from public.products where id = (line->>'product_id')::uuid and active;
    if not found or (line->>'quantity')::integer not between 1 and 99
      or not ((line->>'color') = any(p.colors)) or not ((line->>'temperature') = any(p.temperatures)) then
      raise exception 'A product or selected option is unavailable. Please review your basket.';
    end if;
    if (select sum((value->>'quantity')::integer) from jsonb_array_elements(p_items) where value->>'product_id' = p.id::text) > p.stock then
      raise exception 'Not enough stock for %. Please update your basket.', p.name;
    end if;
    snapshots := snapshots || jsonb_build_array(jsonb_build_object('product_id', p.id, 'name', p.name, 'sku', p.sku, 'image_off', p.image_off,
      'color', line->>'color', 'temperature', line->>'temperature', 'quantity', (line->>'quantity')::integer, 'unit_price', coalesce(p.sale_price,p.price)));
    total := total + coalesce(p.sale_price,p.price) * (line->>'quantity')::integer;
  end loop;
  for line in select jsonb_build_object('id', value->>'product_id', 'quantity', sum((value->>'quantity')::integer)) from jsonb_array_elements(p_items) group by value->>'product_id' loop
    update public.products set stock = stock - (line->>'quantity')::integer where id = (line->>'id')::uuid;
  end loop;
  insert into public.orders(request_id, customer_name, phone, email, city, address, notes, items, subtotal, currency, ip_hash)
    values(p_request_id, p_customer->>'customer_name', phone_value, coalesce(p_customer->>'email',''), p_customer->>'city', p_customer->>'address',
      coalesce(p_customer->>'notes',''), snapshots, total, coalesce((select data->>'currency' from public.site_settings where id = 1),'DZD'), p_ip_hash)
    returning * into result;
  return result;
end; $$;
revoke all on function public.create_lighting_order(uuid,jsonb,jsonb,text) from public, anon, authenticated;
grant execute on function public.create_lighting_order(uuid,jsonb,jsonb,text) to service_role;

create function public.restore_cancelled_order_stock() returns trigger language plpgsql security definer set search_path = '' as $$
declare line jsonb;
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' then raise exception 'Cancelled requests cannot be reopened.'; end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    for line in select value from jsonb_array_elements(old.items) order by value->>'product_id' loop
      update public.products set stock = stock + (line->>'quantity')::integer where id = (line->>'product_id')::uuid;
    end loop;
  end if;
  return new;
end; $$;
revoke all on function public.restore_cancelled_order_stock() from public;
create trigger cancel_order_restore_stock before update of status on public.orders for each row execute function public.restore_cancelled_order_stock();

-- Serialize notification attempts so double-clicks and browser retries do not double-send.
create function public.claim_order_notification(p_order_id uuid) returns public.orders language plpgsql security definer set search_path = '' as $$
declare result public.orders;
begin
  update public.orders set telegram_claimed_at = now() where id = p_order_id and telegram_status <> 'sent'
    and (telegram_claimed_at is null or telegram_claimed_at < now() - interval '2 minutes') returning * into result;
  return result;
end; $$;
revoke all on function public.claim_order_notification(uuid) from public, anon, authenticated;
grant execute on function public.claim_order_notification(uuid) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('lighting-images','lighting-images',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']);
create policy "Public lighting images" on storage.objects for select to anon, authenticated using (bucket_id = 'lighting-images');
create policy "Admin lighting uploads" on storage.objects for insert to authenticated with check (bucket_id = 'lighting-images' and (select public.is_store_admin()));
create policy "Admin lighting image changes" on storage.objects for update to authenticated using (bucket_id = 'lighting-images' and (select public.is_store_admin())) with check (bucket_id = 'lighting-images' and (select public.is_store_admin()));
create policy "Admin lighting image removal" on storage.objects for delete to authenticated using (bucket_id = 'lighting-images' and (select public.is_store_admin()));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('tour-panoramas','tour-panoramas',true,31457280,array['image/jpeg','image/png','image/webp']);
create policy "Public tour panoramas" on storage.objects for select to anon, authenticated using (bucket_id = 'tour-panoramas');
create policy "Admin tour panorama uploads" on storage.objects for insert to authenticated with check (bucket_id = 'tour-panoramas' and (select public.is_store_admin()));
create policy "Admin tour panorama changes" on storage.objects for update to authenticated using (bucket_id = 'tour-panoramas' and (select public.is_store_admin())) with check (bucket_id = 'tour-panoramas' and (select public.is_store_admin()));
create policy "Admin tour panorama removal" on storage.objects for delete to authenticated using (bucket_id = 'tour-panoramas' and (select public.is_store_admin()));

-- After creating your admin user under Authentication > Users, run:
-- insert into public.admins(user_id) values ('YOUR_AUTH_USER_UUID');
