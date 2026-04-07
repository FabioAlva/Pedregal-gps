CREATE TABLE IF NOT EXISTS "repuestos" (
  "id" serial PRIMARY KEY,
  "organizacion_id" integer REFERENCES "organizaciones"("id") ON DELETE SET NULL,
  "nombre" text NOT NULL,
  "sku" text,
  "unidad" text DEFAULT 'UND',
  "stock_actual" double precision NOT NULL DEFAULT 0,
  "stock_minimo" double precision NOT NULL DEFAULT 0,
  "ubicacion" text,
  "descripcion" text,
  "activo" boolean NOT NULL DEFAULT true,
  "created_at" timestamp(3) NOT NULL DEFAULT now(),
  "updated_at" timestamp(3)
);

CREATE UNIQUE INDEX IF NOT EXISTS "repuestos_sku_idx" ON "repuestos" ("sku");
CREATE INDEX IF NOT EXISTS "repuestos_org_idx" ON "repuestos" ("organizacion_id");
