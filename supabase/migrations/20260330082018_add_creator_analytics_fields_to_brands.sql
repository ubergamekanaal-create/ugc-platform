-- Add creator analytics fields to brands table

ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS creator_enabled boolean DEFAULT false;

ALTER TABLE public.brands
ADD COLUMN IF NOT EXISTS creator_visible_metrics text[] DEFAULT '{}';