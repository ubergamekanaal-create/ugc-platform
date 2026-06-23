ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS custom_domain TEXT;

ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS domain_status TEXT DEFAULT 'pending';

ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS domain_verified_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS brands_custom_domain_unique
ON public.brands(custom_domain)
WHERE custom_domain IS NOT NULL;