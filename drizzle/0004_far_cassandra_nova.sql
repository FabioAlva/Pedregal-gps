CREATE TABLE "implementos" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizacion_id" integer,
	"flota_id" integer,
	"nombre" text NOT NULL,
	"tipo" text NOT NULL,
	"serie" text,
	"estado" text DEFAULT 'OPERATIVO' NOT NULL,
	"descripcion" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "implementos_serie_unique" UNIQUE("serie")
);
--> statement-breakpoint
ALTER TABLE "implementos" ADD CONSTRAINT "implementos_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "implementos" ADD CONSTRAINT "implementos_flota_id_flotas_id_fk" FOREIGN KEY ("flota_id") REFERENCES "public"."flotas"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "implementos_flota_idx" ON "implementos" USING btree ("flota_id");