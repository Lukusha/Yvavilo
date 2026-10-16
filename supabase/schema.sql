-- Run in the Supabase SQL editor. Safe to reapply; no customer records are deleted.
create extension if not exists pgcrypto;
create table if not exists public.profiles(id uuid primary key references auth.users on delete cascade,name text not null default '',email text not null default '',created_at timestamptz not null default now());
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id,name,email) values(new.id,coalesce(new.raw_user_meta_data->>'name',''),coalesce(new.email,'')) on conflict(id) do nothing;return new;end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create table if not exists public.recipients(id text not null,user_id uuid not null references auth.users on delete cascade,data jsonb not null,created_at timestamptz not null default now(),primary key(id,user_id));
create table if not exists public.occasions(id text not null,user_id uuid not null references auth.users on delete cascade,recipient_id text,data jsonb not null,created_at timestamptz not null default now(),primary key(id,user_id));
create table if not exists public.orders(id text not null,user_id uuid not null references auth.users on delete cascade,recipient_id text,data jsonb not null,created_at timestamptz not null default now(),primary key(id,user_id));
create table if not exists public.deliveries(id text not null,user_id uuid not null references auth.users on delete cascade,recipient_id text,data jsonb not null,created_at timestamptz not null default now(),primary key(id,user_id));
create table if not exists public.notifications(id text not null,user_id uuid not null references auth.users on delete cascade,recipient_id text,data jsonb not null,created_at timestamptz not null default now(),primary key(id,user_id));
create table if not exists public.user_settings(user_id uuid primary key references auth.users on delete cascade,data jsonb not null default 'null',updated_at timestamptz not null default now());
create table if not exists public.products(id text primary key,data jsonb not null,active boolean not null default false,created_at timestamptz not null default now());
create table if not exists public.staff(user_id uuid primary key references auth.users on delete cascade);
create table if not exists public.push_subscriptions(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,endpoint text not null unique,subscription jsonb not null,created_at timestamptz not null default now());
create table if not exists public.push_jobs(id uuid primary key default gen_random_uuid(),notification_id text not null,user_id uuid not null,subscription_id uuid references public.push_subscriptions on delete cascade,payload jsonb not null,sent_at timestamptz,attempts int not null default 0,unique(notification_id,subscription_id));

-- Remove policies from the earlier prototype before installing scoped access.
do $$ declare t text;p record;begin
 foreach t in array array['profiles','recipients','occasions','orders','deliveries','notifications','user_settings','products','staff','push_subscriptions','push_jobs'] loop
 execute format('alter table public.%I enable row level security',t);
 for p in select policyname from pg_policies where schemaname='public' and tablename=t loop execute format('drop policy %I on public.%I',p.policyname,t);end loop;
 end loop;end $$;
create policy profile_owner on public.profiles for select to authenticated using(auth.uid()=id);
create policy recipient_owner on public.recipients for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy occasion_owner on public.occasions for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy settings_owner on public.user_settings for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy subscription_owner on public.push_subscriptions for all to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy own_orders on public.orders for select to authenticated using(auth.uid()=user_id);
create policy own_deliveries on public.deliveries for select to authenticated using(auth.uid()=user_id);
create policy own_notifications on public.notifications for select to authenticated using(auth.uid()=user_id);
create policy read_notifications on public.notifications for update to authenticated using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy product_read on public.products for select to authenticated using(true);
create policy own_staff on public.staff for select to authenticated using(auth.uid()=user_id);
-- Only privileged functions or service-role integrations can change orders/deliveries/prices.
revoke all on public.orders,public.deliveries,public.products,public.staff,public.push_jobs from anon,authenticated;
grant select on public.orders,public.deliveries,public.products,public.staff to authenticated;
grant select,insert,update,delete on public.recipients,public.occasions,public.user_settings,public.push_subscriptions to authenticated;
grant select,update on public.notifications to authenticated;
grant select on public.profiles to authenticated;

create or replace function public.validate_occasion() returns trigger language plpgsql set search_path=public as $$
begin
 if not exists(select 1 from recipients where id=new.recipient_id and user_id=new.user_id) then raise exception 'მიმღები ვერ მოიძებნა.';end if;
 if length(trim(coalesce(new.data->>'name','')))=0 or length(new.data->>'name')>200 then raise exception 'მიუთითეთ თარიღის სახელი.';end if;
 if coalesce(new.data->>'date','') !~ '^\d{2}-\d{2}$' then raise exception 'მიუთითეთ სწორი თარიღი.';end if;
 perform ('2000-'||(new.data->>'date'))::date;
 return new;end $$;
drop trigger if exists validate_occasion on public.occasions;
create trigger validate_occasion before insert or update on public.occasions for each row execute function public.validate_occasion();

create or replace function public.save_person(person jsonb,custom_day jsonb default null) returns void language plpgsql security invoker set search_path=public as $$
declare uid uuid:=auth.uid();pid text:=person->>'id';kind text;field text;day text;oid text;
begin
 if uid is null then raise exception 'შედით ანგარიშში.';end if;
 if length(trim(coalesce(person->>'name','')))=0 or length(person->>'name')>150 or length(coalesce(pid,''))=0 then raise exception 'მიუთითეთ სახელი.';end if;
 insert into recipients(id,user_id,data) values(pid,uid,person) on conflict(id,user_id) do update set data=excluded.data;
 foreach field in array array['birthday','anniversary'] loop
 day:=person->>field;kind:=case field when 'birthday' then 'Birthday' else 'Anniversary' end;oid:=field||'-'||pid;
 if coalesce(day,'')<>'' then
 insert into occasions(id,user_id,recipient_id,data) values(oid,uid,pid,jsonb_build_object('id',oid,'recipientId',pid,'name',(person->>'name')||case field when 'birthday' then ' — დაბადების დღე' else ' — წლისთავი' end,'date',day,'type',kind)) on conflict(id,user_id) do update set data=excluded.data;
 else delete from occasions where id=oid and user_id=uid;end if;
 end loop;
 if custom_day is not null then oid:=coalesce(custom_day->>'id',gen_random_uuid()::text);insert into occasions(id,user_id,recipient_id,data) values(oid,uid,pid,jsonb_build_object('id',oid,'recipientId',pid,'name',custom_day->>'name','date',custom_day->>'date','type','Custom')) on conflict(id,user_id) do update set data=excluded.data;end if;
end $$;

create or replace function public.place_order(payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=auth.uid();person jsonb;product jsonb;result jsonb;oid text:=payload->>'id';delivery_day date;existing jsonb;
begin
 if uid is null then raise exception 'შედით ანგარიშში.';end if;
 select data into existing from orders where id=oid and user_id=uid;if found then return existing;end if;
 if oid is null or length(oid)>100 then raise exception 'შეკვეთის ნომერი არასწორია.';end if;
 select data into person from recipients where id=payload->>'recipientId' and user_id=uid;
 if person is null then raise exception 'მიმღები ვერ მოიძებნა.';end if;
 if length(trim(coalesce(person->>'address','')))<5 then raise exception 'მიმღების პროფილში მიუთითეთ სრული მისამართი.';end if;
 select data into product from products where id=payload->>'bouquetId' and active;
 if product is null then raise exception 'თაიგული აღარ არის ხელმისაწვდომი.';end if;
 delivery_day:=(payload->>'deliveryDate')::date;
 if delivery_day is null or delivery_day<(now() at time zone 'Asia/Tbilisi')::date then raise exception 'აირჩიეთ მომავალი თარიღი.';end if;
 if length(coalesce(payload->>'message',''))>280 then raise exception 'ბარათი უნდა იყოს 280 სიმბოლომდე.';end if;
 if (product->>'price')::numeric<=0 then raise exception 'თაიგულის ფასი არ არის მითითებული.';end if;
 result:=jsonb_build_object('id',oid,'recipientId',person->>'id','recipientName',person->>'name','bouquetId',product->>'id','bouquetName',product->>'name','bouquetImage',product->>'image','occasion',payload->>'occasion','message',payload->>'message','deliveryDate',delivery_day,'deliveryTime',payload->>'deliveryTime','address',person->>'address','price',(product->>'price')::numeric,'status','Pending','createdAt',now());
 insert into orders(id,user_id,recipient_id,data) values(oid,uid,person->>'id',result);
 insert into notifications(id,user_id,recipient_id,data) values('order-'||oid,uid,person->>'id',jsonb_build_object('id','order-'||oid,'kind','delivery','title','შეკვეთის მოთხოვნა მიღებულია','detail','მოთხოვნა ელოდება დადასტურებას. გადახდა ჯერ არ შესრულებულა.','recipientId',person->>'id','read',false));
 return result;
end $$;
revoke execute on function public.place_order(jsonb) from public,anon;
grant execute on function public.place_order(jsonb) to authenticated;
revoke execute on function public.save_person(jsonb,jsonb) from public,anon;
grant execute on function public.save_person(jsonb,jsonb) to authenticated;

-- Photos remain private; authenticated owners request expiring signed URLs.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('profile-photos','profile-photos',false,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "users can upload profile photos" on storage.objects;
drop policy if exists "users can update profile photos" on storage.objects;
drop policy if exists "profile photos are public" on storage.objects;
drop policy if exists private_photos on storage.objects;
create policy private_photos on storage.objects for all to authenticated using(bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='profile-photos' and (storage.foldername(name))[1]=auth.uid()::text);

-- Keep the profile's standard dates consistent when a date is edited or removed.
create or replace function public.sync_standard_date() returns trigger language plpgsql security invoker set search_path=public as $$
declare item record;field text;
begin
 if tg_op='DELETE' then item:=old;else item:=new;end if;
 field:=case when item.id='birthday-'||item.recipient_id then 'birthday' when item.id='anniversary-'||item.recipient_id then 'anniversary' else null end;
 if field is not null then
 if tg_op='DELETE' then update recipients set data=data-field where id=item.recipient_id and user_id=item.user_id;
 else update recipients set data=jsonb_set(data,array[field],item.data->'date') where id=item.recipient_id and user_id=item.user_id;end if;
 end if;return null;end $$;
drop trigger if exists sync_standard_date on public.occasions;
create trigger sync_standard_date after insert or update or delete on public.occasions for each row execute function public.sync_standard_date();

create or replace function public.staff_orders() returns setof jsonb language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from staff where user_id=auth.uid()) then raise exception 'წვდომა შეზღუდულია.';end if;
 return query select o.data||jsonb_build_object('customerEmail',p.email,'customerName',p.name) from orders o left join profiles p on p.id=o.user_id order by o.created_at desc;
end $$;
create or replace function public.fulfill_order(order_id text,next_status text) returns void language plpgsql security definer set search_path=public as $$
declare item public.orders;old_status text;newdata jsonb;did text;
begin
 if not exists(select 1 from staff where user_id=auth.uid()) then raise exception 'წვდომა შეზღუდულია.';end if;
 select * into item from orders where id=order_id for update;if not found then raise exception 'შეკვეთა ვერ მოიძებნა.';end if;
 old_status:=item.data->>'status';
 if not ((old_status='Pending' and next_status in ('Confirmed','Cancelled')) or (old_status in ('Confirmed','Scheduled') and next_status in ('Delivered','Cancelled'))) then raise exception 'სტატუსის ცვლილება არ არის დაშვებული.';end if;
 update orders set data=jsonb_set(data,'{status}',to_jsonb(next_status)) where id=item.id and user_id=item.user_id;
 if next_status='Delivered' then did:='delivery-'||item.id;insert into deliveries(id,user_id,recipient_id,data) values(did,item.user_id,item.recipient_id,jsonb_build_object('id',did,'recipientId',item.recipient_id,'bouquetId',item.data->>'bouquetId','deliveredAt',now(),'message',item.data->>'message')) on conflict do nothing;end if;
 did:='status-'||item.id||'-'||next_status;
 newdata:=jsonb_build_object('id',did,'kind','delivery','title',case next_status when 'Delivered' then 'თქვენი ყვავილები მიტანილია' when 'Confirmed' then 'თქვენი შეკვეთა დადასტურებულია' else 'თქვენი შეკვეთა გაუქმებულია' end,'detail','შეამოწმეთ შეკვეთის დეტალები.','recipientId',item.recipient_id,'read',false);
 insert into notifications(id,user_id,recipient_id,data) values(did,item.user_id,item.recipient_id,newdata) on conflict do nothing;
end $$;
revoke execute on function public.staff_orders(),public.fulfill_order(text,text) from public,anon;
grant execute on function public.staff_orders(),public.fulfill_order(text,text) to authenticated;

create or replace function public.enqueue_reminders() returns void language plpgsql security definer set search_path=public as $$
declare item record;offset_days int;target date;nid text;
begin
 foreach offset_days in array array[7,1,0] loop
 target:=(now() at time zone 'Asia/Tbilisi')::date+offset_days;
 for item in select * from occasions where data->>'date'=to_char(target,'MM-DD') loop
 nid:='occasion-'||item.id||'-'||target::text||'-'||offset_days;
 insert into notifications(id,user_id,recipient_id,data) values(nid,item.user_id,item.recipient_id,jsonb_build_object('id',nid,'kind','occasion','title',item.data->>'name','detail',case offset_days when 0 then 'დღეს განსაკუთრებული დღეა.' when 1 then 'ხვალ განსაკუთრებული დღეა.' else 'მნიშვნელოვან დღემდე 7 დღე დარჩა.' end,'recipientId',item.recipient_id,'read',false)) on conflict do nothing;
 end loop;end loop;
 insert into push_jobs(notification_id,user_id,subscription_id,payload)
 select n.id,n.user_id,s.id,jsonb_build_object('id',n.id,'title',n.data->>'title','body',n.data->>'detail','url','/notifications')
 from notifications n join push_subscriptions s on s.user_id=n.user_id where n.created_at>now()-interval '1 day' and coalesce((n.data->>'read')::boolean,false)=false and n.created_at>=s.created_at
 on conflict(notification_id,subscription_id) do nothing;
end $$;
revoke execute on function public.enqueue_reminders() from public,anon,authenticated;
grant execute on function public.enqueue_reminders() to service_role;

-- Atomically lease push jobs so overlapping scheduled invocations do not send twice.
alter table public.push_jobs add column if not exists next_attempt_at timestamptz not null default now();
create or replace function public.claim_push_jobs() returns setof jsonb language sql security definer set search_path=public as $$
 with selected as (select id from push_jobs where sent_at is null and attempts<5 and next_attempt_at<=now() order by id limit 20 for update skip locked),
 claimed as (update push_jobs j set attempts=j.attempts+1,next_attempt_at=now()+interval '10 minutes' from selected s where j.id=s.id returning j.*)
 select to_jsonb(c)||jsonb_build_object('subscription',s.subscription) from claimed c join push_subscriptions s on s.id=c.subscription_id;
$$;
revoke execute on function public.claim_push_jobs() from public,anon,authenticated;
grant execute on function public.claim_push_jobs() to service_role;

create unique index if not exists orders_unique_id on public.orders(id);
grant all on public.push_jobs,public.push_subscriptions,public.notifications to service_role;
