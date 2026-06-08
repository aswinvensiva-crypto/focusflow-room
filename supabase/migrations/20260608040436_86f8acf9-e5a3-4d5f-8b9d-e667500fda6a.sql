
CREATE TABLE public.blocked_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_at timestamptz NOT NULL DEFAULT now(),
  blocked_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
GRANT ALL ON public.blocked_users TO service_role;

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view blocked users"
ON public.blocked_users FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can see if they are blocked"
ON public.blocked_users FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can block users"
ON public.blocked_users FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can unblock users"
ON public.blocked_users FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
