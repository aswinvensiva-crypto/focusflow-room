-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 3. Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create function to check if user has any role (admin or staff)
CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'staff')
  )
$$;

-- 6. RLS policies for user_roles table
CREATE POLICY "Admins can view all user roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert user roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update user roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 7. Drop old permissive RLS policies and create new role-based ones for bookings
DROP POLICY IF EXISTS "Authenticated users can delete bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can view bookings" ON public.bookings;

CREATE POLICY "Staff and admins can view bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can insert bookings"
ON public.bookings FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete bookings"
ON public.bookings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8. Drop old policies and create new role-based ones for customers
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;

CREATE POLICY "Staff and admins can view customers"
ON public.customers FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can insert customers"
ON public.customers FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Staff and admins can update customers"
ON public.customers FOR UPDATE
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can delete customers"
ON public.customers FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 9. Drop old policies and create new role-based ones for expenses
DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Authenticated users can view expenses" ON public.expenses;

CREATE POLICY "Only admins can view expenses"
ON public.expenses FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can insert expenses"
ON public.expenses FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update expenses"
ON public.expenses FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete expenses"
ON public.expenses FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 10. Drop old policies and create new role-based ones for rooms
DROP POLICY IF EXISTS "Authenticated users can delete rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can insert rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can update rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can view rooms" ON public.rooms;

CREATE POLICY "Staff and admins can view rooms"
ON public.rooms FOR SELECT
TO authenticated
USING (public.is_staff_or_admin(auth.uid()));

CREATE POLICY "Only admins can insert rooms"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update rooms"
ON public.rooms FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete rooms"
ON public.rooms FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));