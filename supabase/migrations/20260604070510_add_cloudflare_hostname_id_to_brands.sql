ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS custom_domain_id TEXT;