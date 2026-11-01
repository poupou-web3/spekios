-- Spekios auth bridge: server-only tables (service_role only; no anon/authenticated grants).
CREATE TABLE public.bridge_clients (
  client_id text PRIMARY KEY CHECK (client_id ~ '^[a-z0-9][a-z0-9_-]{2,63}$'),
  display_name text NOT NULL,
  redirect_uris text[] NOT NULL DEFAULT '{}',
  secret_sha256 text NOT NULL CHECK (secret_sha256 ~ '^[0-9a-f]{64}$'),
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bridge_clients TO service_role;
ALTER TABLE public.bridge_clients ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bridge_handoff_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash text NOT NULL UNIQUE,
  client_id text NOT NULL REFERENCES public.bridge_clients(client_id) ON DELETE CASCADE,
  redirect_uri text NOT NULL,
  code_challenge text NOT NULL,
  user_id uuid NOT NULL,
  issuer text NOT NULL,
  subject text NOT NULL,
  email text,
  email_verified boolean NOT NULL DEFAULT false,
  providers text[] NOT NULL DEFAULT '{}',
  auth_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
CREATE INDEX bridge_handoff_codes_user_created ON public.bridge_handoff_codes (user_id, created_at DESC);
CREATE INDEX bridge_handoff_codes_expires ON public.bridge_handoff_codes (expires_at);
GRANT ALL ON public.bridge_handoff_codes TO service_role;
ALTER TABLE public.bridge_handoff_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.bridge_rate_events (
  id bigserial PRIMARY KEY,
  bucket text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bridge_rate_events_bucket ON public.bridge_rate_events (bucket, created_at DESC);
GRANT ALL ON public.bridge_rate_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.bridge_rate_events_id_seq TO service_role;
ALTER TABLE public.bridge_rate_events ENABLE ROW LEVEL SECURITY;

-- Atomic single-use consumption: only one caller can ever get the row back.
CREATE OR REPLACE FUNCTION public.consume_bridge_code(p_code_hash text)
RETURNS SETOF public.bridge_handoff_codes
LANGUAGE sql
SET search_path = public
AS $$
  UPDATE public.bridge_handoff_codes
     SET consumed_at = now()
   WHERE code_hash = p_code_hash
     AND consumed_at IS NULL
  RETURNING *;
$$;
REVOKE ALL ON FUNCTION public.consume_bridge_code(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_bridge_code(text) TO service_role;

-- Sliding-window rate limit. Returns true when the call is allowed.
CREATE OR REPLACE FUNCTION public.bridge_rate_hit(p_bucket text, p_window_seconds int, p_max int)
RETURNS boolean
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE n int;
BEGIN
  DELETE FROM public.bridge_rate_events WHERE created_at < now() - interval '1 hour';
  SELECT count(*) INTO n FROM public.bridge_rate_events
   WHERE bucket = p_bucket AND created_at > now() - make_interval(secs => p_window_seconds);
  IF n >= p_max THEN RETURN false; END IF;
  INSERT INTO public.bridge_rate_events(bucket) VALUES (p_bucket);
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.bridge_rate_hit(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bridge_rate_hit(text, int, int) TO service_role;