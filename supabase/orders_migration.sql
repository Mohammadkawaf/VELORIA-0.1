-- ======================================================
-- VELORIA - SQL MIGRATION: ORDERS SYSTEM (PHASE 1 - 100% IDEMPOTENT & SAFE)
-- ======================================================

-- Enable necessary extensions safely
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. Create the PostgreSQL ENUM type for order status if it doesn't exist (comprising both legacy and new statuses for 100% compatibility)
do $$
begin
    if not exists (select 1 from pg_type where typname = 'order_status') then
        create type public.order_status as enum ('pending', 'contacted', 'processing', 'ready', 'accepted', 'rejected', 'delivered', 'completed', 'cancelled');
    end if;
end $$;

-- For existing databases, if 'order_status' already exists but lacks the new values, we safely add them.
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction/do-block in PostgreSQL, so these are executed as top-level individual queries.
alter type public.order_status add value if not exists 'accepted';
alter type public.order_status add value if not exists 'rejected';
alter type public.order_status add value if not exists 'delivered';

-- 2. Create the sequence for order numbers
create sequence if not exists public.order_number_seq start with 1;

-- 3. Create the order number generation function (re-creatable safely)
create or replace function public.generate_order_number()
returns text as $$
begin
  return 'VL-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');
end;
$$ language plpgsql;

-- 4. Create the orders table if it doesn't exist
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    product_id uuid references public.products(id) on delete restrict not null,
    seller_id uuid references public.profiles(id) on delete restrict not null,
    buyer_id uuid references public.profiles(id) on delete restrict not null,
    quantity integer not null default 1 constraint orders_quantity_check check (quantity > 0),
    buyer_message text,
    product_price numeric(12,2) not null constraint orders_product_price_check check (product_price >= 0),
    status public.order_status default 'pending'::public.order_status,
    order_number text unique default public.generate_order_number(),
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now()),
    constraint orders_buyer_seller_check check (buyer_id <> seller_id)
);

-- 5. If table already exists, safely apply updates/migrations to columns and constraints
-- Add columns if not already present
alter table public.orders add column if not exists product_id uuid;
alter table public.orders add column if not exists seller_id uuid;
alter table public.orders add column if not exists buyer_id uuid;
alter table public.orders add column if not exists quantity integer default 1;
alter table public.orders add column if not exists buyer_message text;
alter table public.orders add column if not exists product_price numeric(12,2);
alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists created_at timestamp with time zone default timezone('utc'::text, now());
alter table public.orders add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- Safely add foreign key constraints if they do not exist
do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'orders_product_id_fkey') then
        alter table public.orders add constraint orders_product_id_fkey foreign key (product_id) references public.products(id) on delete restrict;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'orders_seller_id_fkey') then
        alter table public.orders add constraint orders_seller_id_fkey foreign key (seller_id) references public.profiles(id) on delete restrict;
    end if;
    if not exists (select 1 from pg_constraint where conname = 'orders_buyer_id_fkey') then
        alter table public.orders add constraint orders_buyer_id_fkey foreign key (buyer_id) references public.profiles(id) on delete restrict;
    end if;
end $$;

-- Drop check constraints if they exist, then re-create them with explicit names
alter table public.orders drop constraint if exists orders_quantity_check;
alter table public.orders add constraint orders_quantity_check check (quantity > 0);

alter table public.orders drop constraint if exists orders_product_price_check;
alter table public.orders add constraint orders_product_price_check check (product_price >= 0);

alter table public.orders drop constraint if exists orders_buyer_seller_check;
alter table public.orders add constraint orders_buyer_seller_check check (buyer_id <> seller_id);

-- Ensure default and non-null values for quantity and product_price (safely handling pre-existing rows if any)
alter table public.orders alter column quantity set default 1;
update public.orders set quantity = 1 where quantity is null;
alter table public.orders alter column quantity set not null;

update public.orders set product_price = 0.00 where product_price is null;

-- Handle order_number safely: set default and backfill existing rows
alter table public.orders alter column order_number set default public.generate_order_number();
update public.orders set order_number = public.generate_order_number() where order_number is null;

-- Ensure unique constraint on order_number for existing tables
do $$
begin
    if not exists (
        select 1 from pg_constraint 
        where conrelid = 'public.orders'::regclass 
          and conname = 'orders_order_number_key'
    ) then
        alter table public.orders add constraint orders_order_number_key unique (order_number);
    end if;
end $$;

-- Drop legacy check constraints from text-based status if they exist
alter table public.orders drop constraint if exists orders_status_check;

-- Safely convert status column to use the ENUM type
do $$
begin
    -- 1. Check if the status column is text/character varying
    if exists (
        select 1 from information_schema.columns 
        where table_schema = 'public' 
          and table_name = 'orders' 
          and column_name = 'status' 
          and data_type in ('text', 'character varying')
    ) then
        -- Drop default constraint temporarily
        alter table public.orders alter column status drop default;
        
        -- Standardize any legacy/invalid statuses to 'pending' before type conversion (preserving legacy statuses for safety)
        update public.orders 
        set status = 'pending' 
        where status not in ('pending', 'contacted', 'processing', 'ready', 'accepted', 'rejected', 'delivered', 'completed', 'cancelled') 
           or status is null;
        
        -- Alter column type using explicit cast
        alter table public.orders 
          alter column status type public.order_status 
          using status::public.order_status;
          
        -- Re-apply default
        alter table public.orders alter column status set default 'pending'::public.order_status;
    else
        -- If status column doesn't exist at all, add it as the enum type
        if not exists (
            select 1 from information_schema.columns 
            where table_schema = 'public' 
              and table_name = 'orders' 
              and column_name = 'status'
        ) then
            alter table public.orders add column status public.order_status default 'pending'::public.order_status;
        end if;
    end if;
end $$;

-- 6. Enable Row Level Security (RLS) on public.orders
alter table public.orders enable row level security;

-- 7. Recreate and define custom RLS Policies for orders safely
drop policy if exists "Allow buyers, sellers and admins to select orders" on public.orders;
drop policy if exists "Allow buyers to insert orders" on public.orders;
drop policy if exists "Allow buyers, sellers and admins to update orders" on public.orders;
drop policy if exists "Allow parties involved to view orders" on public.orders;
drop policy if exists "Allow buyers to create orders" on public.orders;
drop policy if exists "Allow parties involved to update orders" on public.orders;
drop policy if exists "Allow buyers, sellers and admins to delete orders" on public.orders;

-- SELECT Policy:
-- - Buyer sees their own orders
-- - Seller sees orders of their products (seller_id = auth.uid())
-- - Admin sees all orders
create policy "Allow buyers, sellers and admins to select orders"
  on public.orders for select using (
    auth.uid() = buyer_id or 
    auth.uid() = seller_id or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- INSERT Policy:
-- - A buyer can only create an order for themselves
create policy "Allow buyers to insert orders"
  on public.orders for insert with check (
    auth.uid() = buyer_id
  );

-- UPDATE Policy:
-- - Buyer can update their order (e.g. cancel)
-- - Seller can update their order (e.g. contacted, processing, ready, completed)
-- - Admin can update any order
create policy "Allow buyers, sellers and admins to update orders"
  on public.orders for update using (
    auth.uid() = buyer_id or 
    auth.uid() = seller_id or
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- NO DELETE POLICIES ARE IMPLEMENTED:
-- Because RLS is enabled and there is no policy that grants DELETE access, 
-- deletion of any order is strictly and completely blocked for all non-superuser roles 
-- in order to preserve transaction and order history.
