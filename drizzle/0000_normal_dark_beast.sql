CREATE TYPE "public"."estado_flotas" AS ENUM('OPERATIVO', 'CON_OBSERVACIONES', 'NO_OPERATIVO', 'EN_REPARACION');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text NOT NULL,
	"modelo" text,
	"marca" text,
	"tipo_id" integer NOT NULL,
	"estado_id" integer NOT NULL,
	"especificaciones" jsonb,
	"proximo_mantenimiento" timestamp (3),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "equipos_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "estado_equipos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"disponible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "estado_equipos_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "tipo_equipos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "tipo_equipos_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "flotas" (
	"id" serial PRIMARY KEY NOT NULL,
	"anho" integer NOT NULL,
	"estado" "estado_flotas" DEFAULT 'OPERATIVO' NOT NULL,
	"marca" text NOT NULL,
	"modelo" text NOT NULL,
	"placa" text NOT NULL,
	"vencimiento_soat" timestamp (3) NOT NULL,
	"url_soat_pdf" text,
	"url_foto_unidad" text,
	"url_tarjeta_pdf" text,
	"url_tecnica_pdf" text,
	"vencimiento_tecnica" timestamp (3),
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "flotas_placa_unique" UNIQUE("placa")
);
--> statement-breakpoint
CREATE TABLE "equipo_en_flotas" (
	"id" serial PRIMARY KEY NOT NULL,
	"flota_id" integer NOT NULL,
	"equipo_id" integer NOT NULL,
	"instalado_el" timestamp DEFAULT now() NOT NULL,
	"retirado_el" timestamp
);
--> statement-breakpoint
CREATE TABLE "geofence_stays" (
	"id" serial PRIMARY KEY NOT NULL,
	"geofence_id" integer NOT NULL,
	"fleet_equipment_id" integer NOT NULL,
	"entered_at" timestamp (3) NOT NULL,
	"exited_at" timestamp (3),
	"entry_lat" double precision,
	"entry_lng" double precision,
	"exit_lat" double precision,
	"exit_lng" double precision,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "geocercas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"configuracion" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"color" text DEFAULT '#3b82f6' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"tipo" text DEFAULT 'polygon' NOT NULL,
	"coords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"radius" integer
);
--> statement-breakpoint
CREATE TABLE "gps_alerta_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"alerta_id" integer NOT NULL,
	"fleet_equipment_id" integer NOT NULL,
	"valor_registrado" integer NOT NULL,
	"limite_vigente" integer NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gps_alerta" (
	"id" serial PRIMARY KEY NOT NULL,
	"descripcion" text NOT NULL,
	"limite_valor" integer NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modulos" (
	"id" serial PRIMARY KEY NOT NULL,
	"clave" text NOT NULL,
	"nombre" text NOT NULL,
	CONSTRAINT "modulos_clave_unique" UNIQUE("clave")
);
--> statement-breakpoint
CREATE TABLE "rol_permisos" (
	"id" serial PRIMARY KEY NOT NULL,
	"rol_id" integer NOT NULL,
	"modulo_id" integer NOT NULL,
	"ver" boolean DEFAULT false NOT NULL,
	"agregar" boolean DEFAULT false NOT NULL,
	"editar" boolean DEFAULT false NOT NULL,
	"eliminar" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "roles_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "usuario_roles" (
	"user_id" text NOT NULL,
	"rol_id" integer NOT NULL,
	"asignado_el" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_tipo_id_tipo_equipos_id_fk" FOREIGN KEY ("tipo_id") REFERENCES "public"."tipo_equipos"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_estado_id_estado_equipos_id_fk" FOREIGN KEY ("estado_id") REFERENCES "public"."estado_equipos"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "equipo_en_flotas" ADD CONSTRAINT "equipo_en_flotas_flota_id_flotas_id_fk" FOREIGN KEY ("flota_id") REFERENCES "public"."flotas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipo_en_flotas" ADD CONSTRAINT "equipo_en_flotas_equipo_id_equipos_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."equipos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_stays" ADD CONSTRAINT "geofence_stays_geofence_id_geocercas_id_fk" FOREIGN KEY ("geofence_id") REFERENCES "public"."geocercas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geofence_stays" ADD CONSTRAINT "geofence_stays_fleet_equipment_id_equipo_en_flotas_id_fk" FOREIGN KEY ("fleet_equipment_id") REFERENCES "public"."equipo_en_flotas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_alerta_logs" ADD CONSTRAINT "gps_alerta_logs_alerta_id_gps_alerta_id_fk" FOREIGN KEY ("alerta_id") REFERENCES "public"."gps_alerta"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_alerta_logs" ADD CONSTRAINT "gps_alerta_logs_fleet_equipment_id_equipo_en_flotas_id_fk" FOREIGN KEY ("fleet_equipment_id") REFERENCES "public"."equipo_en_flotas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_modulo_id_modulos_id_fk" FOREIGN KEY ("modulo_id") REFERENCES "public"."modulos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "rol_modulo_idx" ON "rol_permisos" USING btree ("rol_id","modulo_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "usuario_rol_idx" ON "usuario_roles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");