
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  plan_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE TABLE public.photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  path text NOT NULL UNIQUE,
  name text NOT NULL,
  size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX photos_user_idx ON public.photos(user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.photos TO authenticated;
GRANT ALL ON public.photos TO service_role;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own photos read" ON public.photos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own photos insert" ON public.photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own photos delete" ON public.photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL,
  amount numeric(10,2) NOT NULL,
  identifier text UNIQUE,
  pix_code text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments read" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Plan limits in bytes
CREATE OR REPLACE FUNCTION public.plan_limit_bytes(_plan text)
RETURNS bigint LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _plan
    WHEN 'gb20' THEN 20::bigint * 1024*1024*1024
    WHEN 'tb1' THEN 1024::bigint * 1024*1024*1024
    WHEN 'tb2' THEN 2048::bigint * 1024*1024*1024
    ELSE 5::bigint * 1024*1024*1024 END
$$;

CREATE OR REPLACE FUNCTION public.effective_plan(_uid uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT CASE WHEN plan <> 'free' AND plan_expires_at > now() THEN plan ELSE 'free' END
    FROM public.profiles WHERE id = _uid), 'free')
$$;

CREATE OR REPLACE FUNCTION public.used_bytes(_uid uuid)
RETURNS bigint LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(size_bytes),0)::bigint FROM public.photos WHERE user_id = _uid
$$;

CREATE OR REPLACE FUNCTION public.check_photo_quota()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.used_bytes(NEW.user_id) + NEW.size_bytes > public.plan_limit_bytes(public.effective_plan(NEW.user_id)) THEN
    RAISE EXCEPTION 'QUOTA_EXCEEDED';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER photos_quota BEFORE INSERT ON public.photos FOR EACH ROW EXECUTE FUNCTION public.check_photo_quota();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.check_photo_quota() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.used_bytes(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.effective_plan(uuid) FROM PUBLIC, anon;

-- Storage policies for private bucket "photos", files under {uid}/...
CREATE POLICY "photos own read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "photos own upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text
    AND public.used_bytes(auth.uid()) < public.plan_limit_bytes(public.effective_plan(auth.uid())));
CREATE POLICY "photos own delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text);
