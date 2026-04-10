CREATE TABLE "repuestos" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizacion_id" integer,
	"nombre" text NOT NULL,
	"sku" text,
	"unidad" text DEFAULT 'UND',
	"stock_actual" double precision DEFAULT 0 NOT NULL,
	"stock_minimo" double precision DEFAULT 0 NOT NULL,
	"ubicacion" text,
	"descripcion" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "repuestos_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
ALTER TABLE "campos" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "organizaciones" ADD COLUMN "centro_mapa" jsonb;--> statement-breakpoint
ALTER TABLE "organizaciones" ADD COLUMN "limite_mapa" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "repuestos" ADD CONSTRAINT "repuestos_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "repuestos_org_idx" ON "repuestos" USING btree ("organizacion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "repuestos_sku_idx" ON "repuestos" USING btree ("sku");