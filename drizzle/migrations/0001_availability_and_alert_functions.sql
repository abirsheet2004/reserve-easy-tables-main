-- Availability search (Module B): tables free for a time window
create or replace function public.find_available_tables(
  _starts_at timestamptz,
  _ends_at timestamptz,
  _party_size int,
  _category public.table_category default null,
  _exclude_reservation_id uuid default null
)
returns setof public.restaurant_tables
language sql
stable
security definer
set search_path = public
as $$
  select t.*
  from public.restaurant_tables t
  where t.status <> 'maintenance'
    and t.capacity >= _party_size
    and (_category is null or t.category = _category)
    and not exists (
      select 1 from public.reservations r
      where r.table_id = t.id
        and (_exclude_reservation_id is null or r.id <> _exclude_reservation_id)
        and r.status in ('pending','confirmed','seated')
        and r.starts_at < _ends_at
        and r.ends_at > _starts_at
    )
  order by t.capacity asc, t.label asc;
$$;

-- Seating-time display: which windows are bookable, without exposing guest data
create or replace function public.table_bookings_between(_from timestamptz, _to timestamptz)
returns table (table_id uuid, starts_at timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select r.table_id, r.starts_at, r.ends_at
  from public.reservations r
  where r.table_id is not null
    and r.status in ('pending','confirmed','seated')
    and r.starts_at < _to
    and r.ends_at > _from;
$$;

-- Reminder / seating-time alerts (Module F) for upcoming confirmed reservations
create or replace function public.ensure_reservation_alerts()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  res record;
  tbl text;
begin
  if uid is null then return; end if;
  for res in
    select r.id, r.starts_at, r.table_id from public.reservations r
    where r.customer_id = uid
      and r.status = 'confirmed'
      and r.starts_at > now()
      and r.starts_at <= now() + interval '24 hours'
  loop
    tbl := null;
    if res.table_id is not null then
      select label into tbl from public.restaurant_tables where id = res.table_id;
    end if;
    if not exists (
      select 1 from public.notifications n
      where n.reservation_id = res.id and n.type = 'reservation_reminder'
    ) then
      insert into public.notifications (user_id, reservation_id, type, title, message)
      values (
        uid, res.id, 'reservation_reminder', 'Reservation reminder',
        'Reminder: your reservation ' || to_char(res.starts_at, 'Dy DD Mon at HH24:MI')
          || coalesce(' · table ' || tbl, '') || ' is coming up within 24 hours.'
      );
    end if;
    if res.starts_at <= now() + interval '2 hours' and not exists (
      select 1 from public.notifications n
      where n.reservation_id = res.id and n.type = 'seating_alert'
    ) then
      insert into public.notifications (user_id, reservation_id, type, title, message)
      values (
        uid, res.id, 'seating_alert', 'Seating time alert',
        'Your table ' || coalesce(tbl, 'will be assigned') || ' is ready within 2 hours — ' || to_char(res.starts_at, 'HH24:MI') || '. Please head to the restaurant.'
      );
    end if;
  end loop;
end;
$$;

grant execute on function public.find_available_tables(timestamptz, timestamptz, int, public.table_category, uuid) to authenticated;
grant execute on function public.table_bookings_between(timestamptz, timestamptz) to authenticated;
grant execute on function public.ensure_reservation_alerts() to authenticated;
revoke execute on function public.find_available_tables(timestamptz, timestamptz, int, public.table_category, uuid) from anon, public;
revoke execute on function public.table_bookings_between(timestamptz, timestamptz) from anon, public;
revoke execute on function public.ensure_reservation_alerts() from anon, public;
