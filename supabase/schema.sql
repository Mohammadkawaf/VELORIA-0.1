-- ==========================================
-- VELORIA V1 - SUPABASE DATABASE ARCHITECTURE
-- ==========================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ==========================================
-- 1. TABLE: profiles
-- ==========================================
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique not null,
    full_name text,
    profile_image text,
    cover_url text,
    bio text,
    city text default 'الرياض',
    phone text,
    whatsapp text,
    trust_score integer default 100,
    rating numeric(3,2) default 5.0,
    profile_views integer default 0,
    role text default 'visitor' check (role in ('visitor', 'user', 'moderator', 'admin')),
    last_active_at timestamp with time zone default timezone('utc'::text, now()),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- ==========================================
-- 2. TABLE: categories
-- ==========================================
create table public.categories (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    slug text not null unique,
    icon text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.categories enable row level security;

-- ==========================================
-- 3. TABLE: products
-- ==========================================
create table public.products (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    category_id uuid references public.categories(id) on delete restrict not null,
    title text not null,
    description text,
    price numeric(12,2) not null check (price >= 0),
    views_count integer default 0,
    status text default 'active' check (status in ('active', 'sold', 'expired', 'hidden')),
    is_sold boolean default false,
    expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '90 days'),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.products enable row level security;

-- ==========================================
-- 4. TABLE: product_images
-- ==========================================
create table public.product_images (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references public.products(id) on delete cascade not null,
    image_url text not null,
    sort_order integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.product_images enable row level security;

-- ==========================================
-- 5. TABLE: favorites
-- ==========================================
create table public.favorites (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    unique(user_id, product_id)
);

alter table public.favorites enable row level security;

-- ==========================================
-- 6. TABLE: follows
-- ==========================================
create table public.follows (
    id uuid primary key default uuid_generate_v4(),
    follower_id uuid references public.profiles(id) on delete cascade not null,
    following_id uuid references public.profiles(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    unique(follower_id, following_id),
    check (follower_id <> following_id)
);

alter table public.follows enable row level security;

-- ==========================================
-- 7. TABLE: notifications
-- ==========================================
create table public.notifications (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    message text not null,
    type text not null check (type in ('order', 'follow', 'rating', 'system', 'product')),
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.notifications enable row level security;

-- ==========================================
-- 8. TABLE: orders
-- ==========================================
create table public.orders (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references public.products(id) on delete restrict not null,
    seller_id uuid references public.profiles(id) on delete restrict not null,
    buyer_id uuid references public.profiles(id) on delete restrict not null,
    quantity integer not null default 1 check (quantity > 0),
    buyer_message text,
    product_price numeric(12,2) not null check (product_price >= 0),
    status text default 'pending' check (status in ('pending', 'contacted', 'processing', 'ready', 'accepted', 'rejected', 'delivered', 'completed', 'cancelled')),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    check (buyer_id <> seller_id)
);

alter table public.orders enable row level security;

-- ==========================================
-- 9. TABLE: reports
-- ==========================================
create table public.reports (
    id uuid primary key default uuid_generate_v4(),
    reporter_id uuid references public.profiles(id) on delete cascade not null,
    reported_user_id uuid references public.profiles(id) on delete cascade,
    reported_product_id uuid references public.products(id) on delete cascade,
    reason text not null,
    status text default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.reports enable row level security;

-- ==========================================
-- 10. TABLE: ratings
-- ==========================================
create table public.ratings (
    id uuid primary key default uuid_generate_v4(),
    rater_id uuid references public.profiles(id) on delete cascade not null,
    rated_user_id uuid references public.profiles(id) on delete cascade not null,
    order_id uuid references public.orders(id) on delete cascade not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    unique(rater_id, order_id)
);

alter table public.ratings enable row level security;

-- ==========================================
-- 11. TABLE: product_ratings
-- ==========================================
create table public.product_ratings (
    id uuid primary key default uuid_generate_v4(),
    product_id uuid references public.products(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    unique(product_id, user_id)
);

alter table public.product_ratings enable row level security;

-- ==========================================
-- 12. TABLE: badges
-- ==========================================
create table public.badges (
    id uuid primary key default uuid_generate_v4(),
    name text not null unique,
    description text,
    icon text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.badges enable row level security;

-- ==========================================
-- 13. TABLE: user_badges
-- ==========================================
create table public.user_badges (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    badge_id uuid references public.badges(id) on delete cascade not null,
    granted_at timestamp with time zone default timezone('utc'::text, now()),
    unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;

-- ==========================================
-- 14. TABLE: user_agreements
-- ==========================================
create table public.user_agreements (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.profiles(id) on delete cascade not null,
    terms_version text not null,
    accepted_at timestamp with time zone default timezone('utc'::text, now()),
    unique(user_id, terms_version)
);

alter table public.user_agreements enable row level security;


-- ==========================================
-- AUTOMATIC PROFILE SYNC TRIGGER (ON SIGNUP)
-- ==========================================
-- Create custom function to handle new auth user signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  username_val text;
  base_username text;
  counter integer := 1;
begin
  -- 1. Derive base username from metadata or email, default to 'user_' + truncated ID
  base_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''), 
    nullif(split_part(new.email, '@', 1), ''),
    'user_' || substr(new.id::text, 1, 8)
  );
  -- Clean up username (lowercase, remove spaces, etc.)
  base_username := lower(trim(regexp_replace(base_username, '[\s@]', '', 'g')));
  username_val := base_username;

  -- 2. Ensure username is unique and does not collide with existing ones
  while exists (select 1 from public.profiles where username = username_val) loop
    username_val := base_username || counter::text;
    counter := counter + 1;
  end loop;

  -- 3. Insert into profiles with actual column names
  insert into public.profiles (
    id, 
    username, 
    full_name, 
    profile_image, 
    whatsapp,
    role
  )
  values (
    new.id,
    username_val,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), nullif(new.raw_user_meta_data->>'name', ''), 'عضو جديد'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'profile_image', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80'),
    coalesce(new.raw_user_meta_data->>'whatsapp', new.raw_user_meta_data->>'whatsapp_number', new.raw_user_meta_data->>'phone'),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function on auth user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- 1. Profiles Policies
drop policy if exists "Allow public read access to profiles" on public.profiles;
drop policy if exists "Allow users to insert own profile" on public.profiles;
drop policy if exists "Allow users to update own profile" on public.profiles;
drop policy if exists "Allow authenticated users to read own profile" on public.profiles;
drop policy if exists "Allow authenticated users to insert own profile" on public.profiles;
drop policy if exists "Allow authenticated users to update own profile" on public.profiles;

create policy "Allow authenticated users to read own profile" 
  on public.profiles for select using (auth.uid() = id);

create policy "Allow authenticated users to insert own profile" 
  on public.profiles for insert with check (auth.uid() = id);

create policy "Allow authenticated users to update own profile" 
  on public.profiles for update using (auth.uid() = id);

-- 2. Categories Policies
create policy "Allow public read access to categories" 
  on public.categories for select using (true);

create policy "Only admins can modify categories" 
  on public.categories for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. Products Policies
drop policy if exists "Allow public read access to active and sold products" on public.products;
create policy "Allow public read access to active and sold products" 
  on public.products for select using (
    (status in ('active', 'sold')) or 
    auth.uid() = user_id or 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

create policy "Allow users to insert own products" 
  on public.products for insert with check (auth.uid() = user_id);

drop policy if exists "Allow owners, moderators and admins to update products" on public.products;
create policy "Allow owners, moderators and admins to update products" 
  on public.products for update using (
    auth.uid() = user_id or 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  )
  with check (
    true
  );

create policy "Allow owners and admins to delete products" 
  on public.products for delete using (
    auth.uid() = user_id or 
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4. Product Images Policies
create policy "Allow public read access to product images" 
  on public.product_images for select using (true);

create policy "Allow product owners to insert images" 
  on public.product_images for insert with check (
    exists (select 1 from public.products where id = product_id and user_id = auth.uid())
  );

create policy "Allow product owners to delete images" 
  on public.product_images for delete using (
    exists (select 1 from public.products where id = product_id and user_id = auth.uid())
  );

-- 5. Favorites Policies
create policy "Allow users to view own favorites" 
  on public.favorites for select using (auth.uid() = user_id);

create policy "Allow users to manage own favorites" 
  on public.favorites for all using (auth.uid() = user_id);

-- 6. Follows Policies
create policy "Allow public read access to follows" 
  on public.follows for select using (true);

create policy "Allow followers to manage follows" 
  on public.follows for all using (auth.uid() = follower_id);

-- 7. Notifications Policies
create policy "Allow users to see own notifications" 
  on public.notifications for select using (auth.uid() = user_id);

create policy "Allow users to update own notifications" 
  on public.notifications for update using (auth.uid() = user_id);

-- 8. Orders Policies
create policy "Allow buyers, sellers and admins to select orders"
  on public.orders for select using (
    auth.uid() = buyer_id or 
    auth.uid() = seller_id or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Allow buyers to insert orders"
  on public.orders for insert with check (
    auth.uid() = buyer_id
  );

create policy "Allow buyers, sellers and admins to update orders"
  on public.orders for update using (
    auth.uid() = buyer_id or 
    auth.uid() = seller_id or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- 9. Reports Policies
create policy "Allow reporters and staff to view reports" 
  on public.reports for select using (
    auth.uid() = reporter_id or 
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

create policy "Allow users to submit reports" 
  on public.reports for insert with check (auth.uid() = reporter_id);

create policy "Allow staff to update reports" 
  on public.reports for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('moderator', 'admin'))
  );

-- 10. Ratings Policies
create policy "Allow public read access to ratings" 
  on public.ratings for select using (true);

create policy "Allow buyers of orders to insert ratings" 
  on public.ratings for insert with check (
    auth.uid() = rater_id and 
    exists (select 1 from public.orders where id = order_id and buyer_id = auth.uid())
  );

-- 11. Product Ratings Policies
create policy "Allow public read access to product ratings" 
  on public.product_ratings for select using (true);

create policy "Allow authenticated users to insert product ratings" 
  on public.product_ratings for insert with check (auth.uid() = user_id);

-- 12. Badges and relations
create policy "Allow public read access to badges" on public.badges for select using (true);
create policy "Allow public read access to user badges" on public.user_badges for select using (true);
create policy "Only admins can modify user badges" on public.user_badges for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- 13. User agreements
create policy "Allow users to view/manage own agreements" 
  on public.user_agreements for all using (auth.uid() = user_id);


-- ==========================================
-- SEED DATA: DEFAULT CATEGORIES
-- ==========================================
insert into public.categories (name, slug, icon) values
('أزياء وملابس', 'fashion', 'Shirt'),
('أحذية وحقائب', 'bags-shoes', 'Luggage'),
('إلكترونيات', 'electronics', 'Tv'),
('موبايلات وإكسسوارات', 'mobiles', 'Smartphone'),
('أجهزة منزلية', 'home-appliances', 'Home'),
('سيارات وقطع تبديل', 'cars', 'Car'),
('عقارات', 'real-estate', 'Building'),
('أثاث ومفروشات', 'furniture', 'Bed'),
('معدات صناعية', 'industrial', 'Cpu'),
('معدات زراعية', 'agriculture', 'Leaf'),
('رياضة وهوايات', 'sports', 'Dumbbell'),
('كتب وقرطاسية', 'books', 'BookOpen'),
('ألعاب أطفال', 'toys', 'Gamepad'),
('صحة وجمال', 'beauty', 'Sparkles'),
('أطعمة ومشروبات', 'food', 'Utensils'),
('خدمات', 'services', 'Wrench'),
('أخرى', 'others', 'MoreHorizontal')
on conflict (slug) do nothing;


-- ==========================================
-- SEED DATA: DEFAULT BADGES
-- ==========================================
insert into public.badges (name, description, icon) values
('موثق', 'حساب تم التحقق من هويته ومصداقيته الرسمية', 'ShieldCheck'),
('بائع نشط', 'بائع مستمر بإضافة عروض متميزة باستمرار', 'Award'),
('بائع مميز', 'صاحب أعلى تقييمات إيجابية في السوق', 'Star'),
('متجر رسمي', 'مؤسسة أو ورشة عمل مسجلة ومعتمدة', 'Store')
on conflict (name) do nothing;


-- ==========================================
-- INDEXES FOR MAXIMUM SEARCH SPEED (Performance Requirements)
-- ==========================================
create index if not exists products_title_description_idx on public.products using gin (to_tsvector('arabic', title || ' ' || coalesce(description, '')));
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_user_id_idx on public.products(user_id);
create index if not exists products_price_idx on public.products(price);
create index if not exists products_status_idx on public.products(status);
create index if not exists profiles_username_idx on public.profiles(username);
create index if not exists profiles_city_idx on public.profiles(city);
create index if not exists ratings_rated_user_id_idx on public.ratings(rated_user_id);
create index if not exists product_ratings_product_id_idx on public.product_ratings(product_id);


-- ==========================================
-- STORAGE BUCKETS AND POLICIES FOR VELORIA
-- ==========================================
insert into storage.buckets (id, name, public)
values 
  ('avatars', 'avatars', true),
  ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Storage Security Policies
drop policy if exists "Allow public read access to avatars" on storage.objects;
drop policy if exists "Allow public insert access to avatars" on storage.objects;
drop policy if exists "Allow public update access to avatars" on storage.objects;
drop policy if exists "Allow public delete access to avatars" on storage.objects;
drop policy if exists "Allow authenticated users to upload avatars" on storage.objects;
drop policy if exists "Allow owners to update avatars" on storage.objects;
drop policy if exists "Allow owners to delete avatars" on storage.objects;

create policy "Allow public read access to avatars" on storage.objects 
  for select using (bucket_id = 'avatars');

create policy "Allow authenticated users to upload avatars" on storage.objects 
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "Allow owners to update avatars" on storage.objects 
  for update with check (bucket_id = 'avatars' and auth.uid() = owner);

create policy "Allow owners to delete avatars" on storage.objects 
  for delete using (bucket_id = 'avatars' and auth.uid() = owner);

drop policy if exists "Allow public read access to product-images" on storage.objects;
drop policy if exists "Allow public insert access to product-images" on storage.objects;
drop policy if exists "Allow public update access to product-images" on storage.objects;
drop policy if exists "Allow public delete access to product-images" on storage.objects;
drop policy if exists "Allow authenticated users to upload product-images" on storage.objects;
drop policy if exists "Allow owners to update product-images" on storage.objects;
drop policy if exists "Allow owners to delete product-images" on storage.objects;

create policy "Allow public read access to product-images" on storage.objects 
  for select using (bucket_id = 'product-images');

create policy "Allow authenticated users to upload product-images" on storage.objects 
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Allow owners to update product-images" on storage.objects 
  for update with check (bucket_id = 'product-images' and auth.uid() = owner);

create policy "Allow owners to delete product-images" on storage.objects 
  for delete using (bucket_id = 'product-images' and auth.uid() = owner);

