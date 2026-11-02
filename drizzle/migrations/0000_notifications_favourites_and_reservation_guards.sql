-- ===== Notifications (Module 8, in-app) =====
create type public.notification_type as enum (
  'reservation_created',
  'reservation_confirmed',
  'reservation_cancelled',
  'reservation_modified',
  'reservation_reminder',
  'seating_alert',
  'table_assigned'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  type public.notification_type not null,
  title text not null,
  message text not null,
  channel text not null default 'in_app',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, update, insert on public.notifications to authenticated;
grant all on public.notifications to service_role;

alter table public.notifications enable row level security;

create policy "notifications select own"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "notifications update own"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

-- ===== Favourite tables (Module 1) =====
create table public.favourite_tables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  table_id uuid not null references public.restaurant_tables(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, table_id)
);

grant select, insert, delete on public.favourite_tables to authenticated;
grant all on public.favourite_tables to service_role;

alter table public.favourite_tables enable row level security;

create policy "favourites select own"
  on public.favourite_tables for select to authenticated
  using (auth.uid() = user_id);

create policy "favourites insert own"
  on public.favourite_tables for insert to authenticated
  with check (auth.uid() = user_id);

create policy "favourites delete own"
  on public.favourite_tables for delete to authenticated
  using (auth.uid() = user_id);

-- ===== Double-booking + capacity guards (Modules 4/6) =====
create or replace function public.guard_reservation_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.restaurant_tables;
begin
  if new.table_id is not null and new.status in ('pending','confirmed','seated') then
    select * into t from public.restaurant_tables where id = new.table_id;
    if not found then
      raise exception 'Selected table does not exist.';
    end if;
    if t.status = 'maintenance' then
      raise exception 'Table % is unavailable for bookings.', t.label;
    end if;
    if new.party_size > t.capacity then
      raise exception 'Party size % exceeds the seating capacity of table %.', new.party_size, t.label;
    end if;
    if exists (
      select 1 from public.reservations r
      where r.table_id = new.table_id
        and r.id <> new.id
        and r.status in ('pending','confirmed','seated')
        and r.starts_at < new.ends_at
        and r.ends_at > new.starts_at
    ) then
      raise exception 'Table % is already booked for an overlapping time. Please choose another table or time.', t.label;
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_reservation_booking_trigger
  before insert or update of table_id, starts_at, ends_at, status, party_size on public.reservations
  for each row execute function public.guard_reservation_booking();

-- ===== Reservation event notifications (Module 8) =====
create or replace function public.notify_reservation_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  res record;
  tbl_label text;
  when_txt text;
begin
  select id, starts_at, ends_at, guest_name, table_id, status, customer_id
    into res from public.reservations where id = coalesce(new.id, old.id);
  if res.table_id is not null then
    select label into tbl_label from public.restaurant_tables where id = res.table_id;
  end if;
  when_txt := to_char(res.starts_at, 'Dy DD Mon at HH24:MI');

  if tg_op = 'INSERT' then
    insert into public.notifications (user_id, reservation_id, type, title, message)
    values (
      res.customer_id, res.id, 'reservation_created',
      'Reservation received',
      'Thanks ' || coalesce(res.guest_name, 'guest') || '! Your reservation for ' || when_txt
        || coalesce(' · table ' || tbl_label, '') || ' has been received and is awaiting confirmation. You will be notified once it is confirmed.'
    );
  elsif tg_op = 'UPDATE' then
    if old.status is distinct from new.status then
      if new.status = 'confirmed' then
        insert into public.notifications (user_id, reservation_id, type, title, message)
        values (
          res.customer_id, res.id, 'reservation_confirmed',
          'Reservation confirmed',
          'Good news! Your reservation on ' || when_txt || coalesce(' · table ' || tbl_label, '')
            || ' is confirmed. Please arrive a few minutes early.'
        );
      elsif new.status = 'cancelled' then
        insert into public.notifications (user_id, reservation_id, type, title, message)
        values (
          res.customer_id, res.id, 'reservation_cancelled',
          'Reservation cancelled',
          'Your reservation on ' || when_txt || coalesce(' · table ' || tbl_label, '')
            || ' has been cancelled.'
        );
      elsif new.status = 'completed' then
        insert into public.notifications (user_id, reservation_id, type, title, message)
        values (
          res.customer_id, res.id, 'reservation_confirmed',
          'Visit completed',
          'Thanks for dining with us on ' || when_txt || '. We hope to see you again soon!'
        );
      end if;
    elsif (old.starts_at, old.ends_at, old.party_size, old.table_id, old.special_requests)
        is distinct from (new.starts_at, new.ends_at, new.party_size, new.table_id, new.special_requests) then
      insert into public.notifications (user_id, reservation_id, type, title, message)
      values (
        res.customer_id, res.id, 'reservation_modified',
        'Reservation updated',
        'Your reservation details were changed: ' || when_txt || coalesce(' · table ' || tbl_label, '')
          || ' · party of ' || new.party_size::text || '.'
      );
    end if;
  end if;
  return null;
end;
$$;

create trigger notify_reservation_event_trigger
  after insert or update on public.reservations
  for each row execute function public.notify_reservation_event();

-- ===== Deprecate removed CRM fields (kept in DB, no longer used by the app) =====
comment on column public.profiles.dietary_preferences IS 'DEPRECATED: dietary preferences module removed from project scope';
comment on column public.profiles.allergies IS 'DEPRECATED: dietary preferences module removed from project scope';
comment on column public.profiles.loyalty_points IS 'DEPRECATED: guest loyalty/CRM module removed from project scope';
comment on column public.profiles.is_vip IS 'DEPRECATED: guest loyalty/CRM module removed from project scope';

grant execute on function public.guard_reservation_booking() to authenticated;
revoke execute on function public.guard_reservation_booking() from anon, public;
revoke execute on function public.notify_reservation_event() from anon, public;
