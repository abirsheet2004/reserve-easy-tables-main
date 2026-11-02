-- Complete the application schema. This migration is intentionally idempotent
-- because early Lovable versions stored these objects under drizzle/migrations.

DO $$
BEGIN
  CREATE TYPE public.notification_type AS ENUM (
    'reservation_created',
    'reservation_confirmed',
    'reservation_cancelled',
    'reservation_modified',
    'reservation_reminder',
    'seating_alert',
    'table_assigned'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles AS profile
SET email = users.email
FROM auth.users AS users
WHERE users.id = profile.id
  AND profile.email IS DISTINCT FROM users.email;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "profiles staff select" ON public.profiles;
CREATE POLICY "profiles staff select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  channel text NOT NULL DEFAULT 'in_app',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favourite_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_id uuid NOT NULL REFERENCES public.restaurant_tables(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, table_id)
);

-- Upgrade tables created by the old Drizzle migration, which lacked user FKs.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.notifications'::regclass
      AND conname = 'notifications_user_id_fkey'
  ) THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.favourite_tables'::regclass
      AND conname = 'favourite_tables_user_id_fkey'
  ) THEN
    ALTER TABLE public.favourite_tables
      ADD CONSTRAINT favourite_tables_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

GRANT SELECT, UPDATE, INSERT ON public.notifications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.favourite_tables TO authenticated;
GRANT ALL ON public.notifications, public.favourite_tables TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favourite_tables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications select own" ON public.notifications;
CREATE POLICY "notifications select own"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications update own" ON public.notifications;
CREATE POLICY "notifications update own"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favourites select own" ON public.favourite_tables;
CREATE POLICY "favourites select own"
  ON public.favourite_tables FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "favourites insert own" ON public.favourite_tables;
CREATE POLICY "favourites insert own"
  ON public.favourite_tables FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "favourites delete own" ON public.favourite_tables;
CREATE POLICY "favourites delete own"
  ON public.favourite_tables FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);

-- Customers may only create pending reservations and may only cancel their
-- own pending/confirmed reservations. Staff retain the full RLS-granted flow.
CREATE OR REPLACE FUNCTION public.guard_reservation_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL OR public.is_staff(current_user_id) THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.customer_id <> current_user_id OR NEW.status <> 'pending' THEN
      RAISE EXCEPTION 'Customers can only create pending reservations for themselves.';
    END IF;
    IF NEW.starts_at <= now() THEN
      RAISE EXCEPTION 'Reservations must start in the future.';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.customer_id <> current_user_id OR NEW.customer_id <> current_user_id THEN
      RAISE EXCEPTION 'Customers can only update their own reservations.';
    END IF;
    IF OLD.status NOT IN ('pending', 'confirmed') THEN
      RAISE EXCEPTION 'This reservation can no longer be changed.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled' THEN
      RAISE EXCEPTION 'Customers may only cancel a reservation status.';
    END IF;
    IF NEW.status <> 'cancelled' AND NEW.starts_at <= now() THEN
      RAISE EXCEPTION 'Reservations must start in the future.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_reservation_permissions_trigger ON public.reservations;
CREATE TRIGGER guard_reservation_permissions_trigger
  BEFORE INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.guard_reservation_permissions();

CREATE OR REPLACE FUNCTION public.guard_reservation_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_table public.restaurant_tables;
BEGIN
  IF NEW.table_id IS NOT NULL AND NEW.status IN ('pending', 'confirmed', 'seated') THEN
    SELECT * INTO selected_table
    FROM public.restaurant_tables
    WHERE id = NEW.table_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected table does not exist.';
    END IF;
    IF selected_table.status = 'maintenance' THEN
      RAISE EXCEPTION 'Table % is unavailable for bookings.', selected_table.label;
    END IF;
    IF NEW.party_size > selected_table.capacity THEN
      RAISE EXCEPTION 'Party size % exceeds the seating capacity of table %.',
        NEW.party_size, selected_table.label;
    END IF;
    IF EXISTS (
      SELECT 1
      FROM public.reservations AS reservation
      WHERE reservation.table_id = NEW.table_id
        AND reservation.id <> NEW.id
        AND reservation.status IN ('pending', 'confirmed', 'seated')
        AND reservation.starts_at < NEW.ends_at
        AND reservation.ends_at > NEW.starts_at
    ) THEN
      RAISE EXCEPTION
        'Table % is already booked for an overlapping time. Please choose another table or time.',
        selected_table.label;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_reservation_booking_trigger ON public.reservations;
CREATE TRIGGER guard_reservation_booking_trigger
  BEFORE INSERT OR UPDATE OF table_id, starts_at, ends_at, status, party_size
  ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.guard_reservation_booking();

CREATE OR REPLACE FUNCTION public.notify_reservation_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  table_label text;
  when_text text;
BEGIN
  IF NEW.table_id IS NOT NULL THEN
    SELECT label INTO table_label
    FROM public.restaurant_tables
    WHERE id = NEW.table_id;
  END IF;

  when_text := to_char(NEW.starts_at, 'Dy DD Mon at HH24:MI');

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, reservation_id, type, title, message)
    VALUES (
      NEW.customer_id,
      NEW.id,
      'reservation_created',
      'Reservation received',
      'Thanks ' || coalesce(NEW.guest_name, 'guest') || '! Your reservation for ' || when_text
        || coalesce(' · table ' || table_label, '')
        || ' has been received and is awaiting confirmation. You will be notified once it is confirmed.'
    );
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'confirmed' THEN
      INSERT INTO public.notifications (user_id, reservation_id, type, title, message)
      VALUES (
        NEW.customer_id,
        NEW.id,
        'reservation_confirmed',
        'Reservation confirmed',
        'Good news! Your reservation on ' || when_text
          || coalesce(' · table ' || table_label, '')
          || ' is confirmed. Please arrive a few minutes early.'
      );
    ELSIF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, reservation_id, type, title, message)
      VALUES (
        NEW.customer_id,
        NEW.id,
        'reservation_cancelled',
        'Reservation cancelled',
        'Your reservation on ' || when_text
          || coalesce(' · table ' || table_label, '')
          || ' has been cancelled.'
      );
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO public.notifications (user_id, reservation_id, type, title, message)
      VALUES (
        NEW.customer_id,
        NEW.id,
        'reservation_confirmed',
        'Visit completed',
        'Thanks for dining with us on ' || when_text || '. We hope to see you again soon!'
      );
    END IF;
  ELSIF (OLD.starts_at, OLD.ends_at, OLD.party_size, OLD.table_id, OLD.special_requests)
      IS DISTINCT FROM
      (NEW.starts_at, NEW.ends_at, NEW.party_size, NEW.table_id, NEW.special_requests) THEN
    INSERT INTO public.notifications (user_id, reservation_id, type, title, message)
    VALUES (
      NEW.customer_id,
      NEW.id,
      'reservation_modified',
      'Reservation updated',
      'Your reservation details were changed: ' || when_text
        || coalesce(' · table ' || table_label, '')
        || ' · party of ' || NEW.party_size::text || '.'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_reservation_event_trigger ON public.reservations;
CREATE TRIGGER notify_reservation_event_trigger
  AFTER INSERT OR UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.notify_reservation_event();

DROP FUNCTION IF EXISTS public.find_available_tables(
  timestamptz,
  timestamptz,
  int,
  public.table_category
);

CREATE OR REPLACE FUNCTION public.find_available_tables(
  _starts_at timestamptz,
  _ends_at timestamptz,
  _party_size int,
  _category public.table_category DEFAULT NULL,
  _exclude_reservation_id uuid DEFAULT NULL
)
RETURNS SETOF public.restaurant_tables
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH caller AS (
    SELECT CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.reservations AS own_reservation
        WHERE own_reservation.id = _exclude_reservation_id
          AND (
            own_reservation.customer_id = auth.uid()
            OR public.is_staff(auth.uid())
          )
      )
      THEN _exclude_reservation_id
      ELSE NULL
    END AS excluded_id
  )
  SELECT restaurant_table.*
  FROM public.restaurant_tables AS restaurant_table
  CROSS JOIN caller
  WHERE _ends_at > _starts_at
    AND _party_size > 0
    AND restaurant_table.status <> 'maintenance'
    AND restaurant_table.capacity >= _party_size
    AND (_category IS NULL OR restaurant_table.category = _category)
    AND NOT EXISTS (
      SELECT 1
      FROM public.reservations AS reservation
      WHERE reservation.table_id = restaurant_table.id
        AND (caller.excluded_id IS NULL OR reservation.id <> caller.excluded_id)
        AND reservation.status IN ('pending', 'confirmed', 'seated')
        AND reservation.starts_at < _ends_at
        AND reservation.ends_at > _starts_at
    )
  ORDER BY restaurant_table.capacity, restaurant_table.label;
$$;

CREATE OR REPLACE FUNCTION public.table_bookings_between(
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE (table_id uuid, starts_at timestamptz, ends_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT reservation.table_id, reservation.starts_at, reservation.ends_at
  FROM public.reservations AS reservation
  WHERE reservation.table_id IS NOT NULL
    AND reservation.status IN ('pending', 'confirmed', 'seated')
    AND reservation.starts_at < _to
    AND reservation.ends_at > _from;
$$;

CREATE OR REPLACE FUNCTION public.ensure_reservation_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  reservation record;
  table_label text;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  FOR reservation IN
    SELECT item.id, item.starts_at, item.table_id
    FROM public.reservations AS item
    WHERE item.customer_id = current_user_id
      AND item.status = 'confirmed'
      AND item.starts_at > now()
      AND item.starts_at <= now() + interval '24 hours'
  LOOP
    table_label := NULL;
    IF reservation.table_id IS NOT NULL THEN
      SELECT label INTO table_label
      FROM public.restaurant_tables
      WHERE id = reservation.table_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE reservation_id = reservation.id
        AND type = 'reservation_reminder'
    ) THEN
      INSERT INTO public.notifications (user_id, reservation_id, type, title, message)
      VALUES (
        current_user_id,
        reservation.id,
        'reservation_reminder',
        'Reservation reminder',
        'Reminder: your reservation ' || to_char(reservation.starts_at, 'Dy DD Mon at HH24:MI')
          || coalesce(' · table ' || table_label, '')
          || ' is coming up within 24 hours.'
      );
    END IF;

    IF reservation.starts_at <= now() + interval '2 hours'
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications
        WHERE reservation_id = reservation.id
          AND type = 'seating_alert'
      )
    THEN
      INSERT INTO public.notifications (user_id, reservation_id, type, title, message)
      VALUES (
        current_user_id,
        reservation.id,
        'seating_alert',
        'Seating time alert',
        'Your table ' || coalesce(table_label, 'will be assigned')
          || ' is ready within 2 hours — '
          || to_char(reservation.starts_at, 'HH24:MI')
          || '. Please head to the restaurant.'
      );
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_available_tables(
  timestamptz,
  timestamptz,
  int,
  public.table_category,
  uuid
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.table_bookings_between(timestamptz, timestamptz)
  TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_reservation_alerts() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.find_available_tables(
  timestamptz,
  timestamptz,
  int,
  public.table_category,
  uuid
) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.table_bookings_between(timestamptz, timestamptz)
  FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.ensure_reservation_alerts() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.guard_reservation_permissions() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.guard_reservation_booking() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.notify_reservation_event() FROM anon, public;

COMMENT ON COLUMN public.profiles.dietary_preferences IS
  'DEPRECATED: dietary preferences module removed from project scope';
COMMENT ON COLUMN public.profiles.allergies IS
  'DEPRECATED: dietary preferences module removed from project scope';
COMMENT ON COLUMN public.profiles.loyalty_points IS
  'DEPRECATED: guest loyalty/CRM module removed from project scope';
COMMENT ON COLUMN public.profiles.is_vip IS
  'DEPRECATED: guest loyalty/CRM module removed from project scope';
