CREATE TABLE "rutas_modulo" (
	"id" serial PRIMARY KEY NOT NULL,
	"modulo_id" integer NOT NULL,
	"patron_ruta" text NOT NULL,
	"tipo_match" text DEFAULT 'prefix' NOT NULL,
	"prioridad" integer DEFAULT 100 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
ALTER TABLE "rutas_modulo" ADD CONSTRAINT "rutas_modulo_modulo_id_modulos_id_fk" FOREIGN KEY ("modulo_id") REFERENCES "public"."modulos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rutas_modulo_idx" ON "rutas_modulo" USING btree ("modulo_id","prioridad");