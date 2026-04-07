ALTER TABLE "organizaciones" ADD COLUMN IF NOT EXISTS "centro_mapa" jsonb;
ALTER TABLE "organizaciones" ADD COLUMN IF NOT EXISTS "limite_mapa" jsonb DEFAULT '[]'::jsonb;
