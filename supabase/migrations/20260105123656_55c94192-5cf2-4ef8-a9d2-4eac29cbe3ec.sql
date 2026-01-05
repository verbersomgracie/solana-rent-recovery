-- Create rate limiting table for has_role function
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  call_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, function_name)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only allow system access (via SECURITY DEFINER functions)
-- No direct user access to this table

-- Create rate limiting helper function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _function_name text,
  _max_calls integer DEFAULT 100,
  _window_seconds integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _current_count integer;
  _window_start timestamp with time zone;
BEGIN
  _user_id := auth.uid();
  
  -- If no user, deny (anonymous users can't use rate-limited functions)
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Get or create rate limit record
  SELECT call_count, window_start INTO _current_count, _window_start
  FROM public.rate_limits
  WHERE user_id = _user_id AND function_name = _function_name;

  -- If no record exists, create one
  IF _current_count IS NULL THEN
    INSERT INTO public.rate_limits (user_id, function_name, call_count, window_start)
    VALUES (_user_id, _function_name, 1, now())
    ON CONFLICT (user_id, function_name) DO NOTHING;
    RETURN true;
  END IF;

  -- Check if window has expired (reset if so)
  IF _window_start < now() - (_window_seconds || ' seconds')::interval THEN
    UPDATE public.rate_limits
    SET call_count = 1, window_start = now()
    WHERE user_id = _user_id AND function_name = _function_name;
    RETURN true;
  END IF;

  -- Check if limit exceeded
  IF _current_count >= _max_calls THEN
    RETURN false;
  END IF;

  -- Increment counter
  UPDATE public.rate_limits
  SET call_count = call_count + 1
  WHERE user_id = _user_id AND function_name = _function_name;

  RETURN true;
END;
$$;

-- Update has_role function with rate limiting (100 calls per minute max)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only allow checking own role
  IF _user_id != auth.uid() THEN
    RETURN false;
  END IF;

  -- Check rate limit (100 calls per 60 seconds)
  IF NOT public.check_rate_limit('has_role', 100, 60) THEN
    RETURN false;
  END IF;

  -- Check if user has the role
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;