-- FFT SHOP: Social + Fashion functionality migration
-- This migration has already been applied to the connected Supabase project.
alter table public.deposit_requests add column if not exists screenshot_url text;
alter table public.site_settings add column if not exists delivery_charge numeric not null default 180 check (delivery_charge >= 0);

insert into public.shop_settings(key,value) values ('delivery_charge','180') on conflict (key) do nothing;
update public.site_settings set delivery_charge=coalesce(delivery_charge,180) where delivery_charge is null;

insert into storage.buckets (id,name,public) values ('fft-payment-screenshots','fft-payment-screenshots',false) on conflict (id) do nothing;
drop policy if exists "users upload own payment screenshots" on storage.objects;
drop policy if exists "admins read payment screenshots" on storage.objects;
create policy "users upload own payment screenshots" on storage.objects for insert to authenticated
with check (bucket_id='fft-payment-screenshots' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "admins read payment screenshots" on storage.objects for select to authenticated
using (bucket_id='fft-payment-screenshots' and exists (select 1 from public.admins a where a.user_id=(select auth.uid())));

create or replace function public.fft_create_service_order_with_balance(
 p_service_type text,p_target_link text,p_quantity integer,p_price numeric,p_notes text default null
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_user_id uuid:=auth.uid(); v_order_id uuid; v_balance numeric;
begin
 if v_user_id is null then raise exception 'Login required'; end if;
 if nullif(trim(p_target_link),'') is null then raise exception 'Target link is required'; end if;
 if p_quantity is null or p_quantity<=0 then raise exception 'Invalid quantity'; end if;
 if p_price is null or p_price<0 then raise exception 'Invalid price'; end if;
 select balance into v_balance from public.wallets where user_id=v_user_id for update;
 if coalesce(v_balance,0)<p_price then raise exception 'Insufficient account balance'; end if;
 insert into public.service_orders(user_id,service_type,target_link,quantity,price,status,notes)
 values(v_user_id,trim(p_service_type),trim(p_target_link),p_quantity,p_price,'confirmed',p_notes) returning id into v_order_id;
 update public.wallets set balance=balance-p_price,updated_at=now() where user_id=v_user_id;
 insert into public.wallet_transactions(user_id,type,amount,status,reference,note)
 values(v_user_id,'service_purchase',p_price,'completed',v_order_id::text,'Social service paid from account balance');
 return v_order_id;
end; $$;
revoke all on function public.fft_create_service_order_with_balance(text,text,integer,numeric,text) from public;
grant execute on function public.fft_create_service_order_with_balance(text,text,integer,numeric,text) to authenticated;

-- Existing order RPC was updated so balance-paid orders are confirmed immediately.
-- Fashion shipping fee is read from site_settings.delivery_charge; default is ৳180.
