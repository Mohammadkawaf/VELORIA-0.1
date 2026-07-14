-- Create RPC function to increment product views count atomically and safely
create or replace function public.increment_product_views(product_id uuid)
returns void as $$
begin
  update public.products
  set views_count = coalesce(views_count, 0) + 1
  where id = product_id;
end;
$$ language plpgsql security definer;

-- Grant execution permissions to anon and authenticated roles
grant execute on function public.increment_product_views(uuid) to anon;
grant execute on function public.increment_product_views(uuid) to authenticated;
