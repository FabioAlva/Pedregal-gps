CREATE TABLE "categorias_gasto" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizacion_id" integer,
	"nombre" text NOT NULL,
	"es_combustible" boolean DEFAULT false NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campo_geocercas" (
	"id" serial PRIMARY KEY NOT NULL,
	"campo_id" integer NOT NULL,
	"geocerca_id" integer NOT NULL,
	"es_perimetro" boolean DEFAULT false NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campos" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizacion_id" integer NOT NULL,
	"parent_id" integer,
	"nombre" text NOT NULL,
	"descripcion" text,
	"categoria" text DEFAULT 'CAMPO' NOT NULL,
	"coords" jsonb DEFAULT '[]'::jsonb,
	"area_total_ha" double precision,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "asignacion_flota" (
	"id" serial PRIMARY KEY NOT NULL,
	"flota_id" integer NOT NULL,
	"operador_id" integer NOT NULL,
	"fecha_inicio" timestamp (3) DEFAULT now() NOT NULL,
	"fecha_fin" timestamp (3),
	"km_inicial" integer,
	"km_final" integer,
	"horas_inicial" double precision,
	"horas_final" double precision,
	"estado_entrega" text,
	"estado_devolucion" text,
	"fotos_entrega" jsonb DEFAULT '[]'::jsonb,
	"fotos_devolucion" jsonb DEFAULT '[]'::jsonb,
	"observaciones" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gastos_flota" (
	"id" serial PRIMARY KEY NOT NULL,
	"flota_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	"operador_id" integer,
	"monto" double precision NOT NULL,
	"fecha" timestamp (3) DEFAULT now() NOT NULL,
	"descripcion" text,
	"metadatos" jsonb DEFAULT '{}'::jsonb,
	"comprobantes_url" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rutas_frontend_backend" (
	"id" serial PRIMARY KEY NOT NULL,
	"frontend_route_id" integer NOT NULL,
	"backend_route_id" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registros_combustible" (
	"id" serial PRIMARY KEY NOT NULL,
	"flota_id" integer NOT NULL,
	"operador_id" integer,
	"gasto_id" integer,
	"galones" double precision NOT NULL,
	"precio_galon" double precision,
	"odometro_km" double precision,
	"horas_motor" double precision,
	"proveedor" text,
	"tipo_combustible" text DEFAULT 'DIESEL',
	"fotos_url" jsonb DEFAULT '[]'::jsonb,
	"fecha" timestamp (3) DEFAULT now() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problemas_inspeccion" (
	"id" serial PRIMARY KEY NOT NULL,
	"inspeccion_id" integer NOT NULL,
	"campo_id" text NOT NULL,
	"descripcion" text NOT NULL,
	"severidad" text NOT NULL,
	"fotos_url" jsonb DEFAULT '[]'::jsonb,
	"resuelto" boolean DEFAULT false NOT NULL,
	"orden_trabajo_id" integer,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plantillas_inspeccion" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizacion_id" integer,
	"nombre" text NOT NULL,
	"descripcion" text,
	"esquema" jsonb NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "inspecciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"flota_id" integer NOT NULL,
	"operador_id" integer,
	"plantilla_id" integer,
	"esquema_snapshot" jsonb,
	"respuestas" jsonb NOT NULL,
	"estado" text NOT NULL,
	"tipo" text DEFAULT 'PRE_USO',
	"firma_url" text,
	"observaciones" text,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historial_mantenimientos" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" integer,
	"flota_id" integer NOT NULL,
	"gasto_id" integer,
	"realizado_por" text,
	"km_al_realizar" integer,
	"horas_al_realizar" double precision,
	"descripcion" text,
	"repuestos_usados" jsonb DEFAULT '[]'::jsonb,
	"fotos_url" jsonb DEFAULT '[]'::jsonb,
	"fecha" timestamp (3) DEFAULT now() NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mantenimientos_programados" (
	"id" serial PRIMARY KEY NOT NULL,
	"flota_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"intervalo_km" integer,
	"intervalo_horas" integer,
	"intervalo_dias" integer,
	"ultimo_km" integer,
	"ultimas_horas" double precision,
	"ultima_fecha" timestamp (3),
	"proxima_fecha" timestamp (3),
	"proximo_km" integer,
	"proximas_horas" double precision,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE "operadores" (
	"id" serial PRIMARY KEY NOT NULL,
	"organizacion_id" integer NOT NULL,
	"user_id" text,
	"nombres" text NOT NULL,
	"apellidos" text NOT NULL,
	"dni" text,
	"licencia" text,
	"categoria_licencia" text,
	"vencimiento_licencia" timestamp (3),
	"telefono" text,
	"foto_url" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "operadores_dni_unique" UNIQUE("dni")
);
--> statement-breakpoint
CREATE TABLE "organizaciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"ruc" text,
	"logo_url" text,
	"direccion" text,
	"telefono" text,
	"activo" boolean DEFAULT true NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3),
	CONSTRAINT "organizaciones_ruc_unique" UNIQUE("ruc")
);
--> statement-breakpoint
CREATE TABLE "rol_permisos_ruta" (
	"id" serial PRIMARY KEY NOT NULL,
	"rol_id" integer NOT NULL,
	"ruta_modulo_id" integer NOT NULL,
	"ver" boolean DEFAULT false NOT NULL,
	"agregar" boolean DEFAULT false NOT NULL,
	"editar" boolean DEFAULT false NOT NULL,
	"eliminar" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "modulos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rol_permisos" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "modulos" CASCADE;--> statement-breakpoint
DROP TABLE "rol_permisos" CASCADE;--> statement-breakpoint
ALTER TABLE "rutas_modulo" DROP CONSTRAINT "rutas_modulo_modulo_id_modulos_id_fk";
--> statement-breakpoint
DROP INDEX "rutas_modulo_idx";--> statement-breakpoint
ALTER TABLE "equipos" ADD COLUMN "organizacion_id" integer;--> statement-breakpoint
ALTER TABLE "flotas" ADD COLUMN "organizacion_id" integer;--> statement-breakpoint
ALTER TABLE "geocercas" ADD COLUMN "organizacion_id" integer;--> statement-breakpoint
ALTER TABLE "gps_alerta" ADD COLUMN "organizacion_id" integer;--> statement-breakpoint
ALTER TABLE "rutas_modulo" ADD COLUMN "nombre" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "rutas_modulo" ADD COLUMN "url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "rutas_modulo" ADD COLUMN "tipo_ruta" text DEFAULT 'frontend' NOT NULL;--> statement-breakpoint
ALTER TABLE "rutas_modulo" ADD COLUMN "metodo" text;--> statement-breakpoint
ALTER TABLE "rutas_modulo" ADD COLUMN "capacidad_clave" text NOT NULL;--> statement-breakpoint
ALTER TABLE "rutas_modulo" ADD COLUMN "accion_requerida" text;--> statement-breakpoint
ALTER TABLE "rutas_modulo" ADD COLUMN "protegida" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "organizacion_id" integer;--> statement-breakpoint
ALTER TABLE "usuario_roles" ADD COLUMN "organizacion_id" integer;--> statement-breakpoint
ALTER TABLE "categorias_gasto" ADD CONSTRAINT "categorias_gasto_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campo_geocercas" ADD CONSTRAINT "campo_geocercas_campo_id_campos_id_fk" FOREIGN KEY ("campo_id") REFERENCES "public"."campos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campo_geocercas" ADD CONSTRAINT "campo_geocercas_geocerca_id_geocercas_id_fk" FOREIGN KEY ("geocerca_id") REFERENCES "public"."geocercas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campos" ADD CONSTRAINT "campos_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignacion_flota" ADD CONSTRAINT "asignacion_flota_flota_id_flotas_id_fk" FOREIGN KEY ("flota_id") REFERENCES "public"."flotas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignacion_flota" ADD CONSTRAINT "asignacion_flota_operador_id_operadores_id_fk" FOREIGN KEY ("operador_id") REFERENCES "public"."operadores"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gastos_flota" ADD CONSTRAINT "gastos_flota_flota_id_flotas_id_fk" FOREIGN KEY ("flota_id") REFERENCES "public"."flotas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gastos_flota" ADD CONSTRAINT "gastos_flota_categoria_id_categorias_gasto_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_gasto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gastos_flota" ADD CONSTRAINT "gastos_flota_operador_id_operadores_id_fk" FOREIGN KEY ("operador_id") REFERENCES "public"."operadores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rutas_frontend_backend" ADD CONSTRAINT "rutas_frontend_backend_frontend_route_id_rutas_modulo_id_fk" FOREIGN KEY ("frontend_route_id") REFERENCES "public"."rutas_modulo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rutas_frontend_backend" ADD CONSTRAINT "rutas_frontend_backend_backend_route_id_rutas_modulo_id_fk" FOREIGN KEY ("backend_route_id") REFERENCES "public"."rutas_modulo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_combustible" ADD CONSTRAINT "registros_combustible_flota_id_flotas_id_fk" FOREIGN KEY ("flota_id") REFERENCES "public"."flotas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_combustible" ADD CONSTRAINT "registros_combustible_operador_id_operadores_id_fk" FOREIGN KEY ("operador_id") REFERENCES "public"."operadores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registros_combustible" ADD CONSTRAINT "registros_combustible_gasto_id_gastos_flota_id_fk" FOREIGN KEY ("gasto_id") REFERENCES "public"."gastos_flota"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problemas_inspeccion" ADD CONSTRAINT "problemas_inspeccion_inspeccion_id_inspecciones_id_fk" FOREIGN KEY ("inspeccion_id") REFERENCES "public"."inspecciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantillas_inspeccion" ADD CONSTRAINT "plantillas_inspeccion_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_flota_id_flotas_id_fk" FOREIGN KEY ("flota_id") REFERENCES "public"."flotas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_operador_id_operadores_id_fk" FOREIGN KEY ("operador_id") REFERENCES "public"."operadores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_plantilla_id_plantillas_inspeccion_id_fk" FOREIGN KEY ("plantilla_id") REFERENCES "public"."plantillas_inspeccion"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_mantenimientos" ADD CONSTRAINT "historial_mantenimientos_schedule_id_mantenimientos_programados_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."mantenimientos_programados"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_mantenimientos" ADD CONSTRAINT "historial_mantenimientos_flota_id_flotas_id_fk" FOREIGN KEY ("flota_id") REFERENCES "public"."flotas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historial_mantenimientos" ADD CONSTRAINT "historial_mantenimientos_gasto_id_gastos_flota_id_fk" FOREIGN KEY ("gasto_id") REFERENCES "public"."gastos_flota"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mantenimientos_programados" ADD CONSTRAINT "mantenimientos_programados_flota_id_flotas_id_fk" FOREIGN KEY ("flota_id") REFERENCES "public"."flotas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operadores" ADD CONSTRAINT "operadores_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operadores" ADD CONSTRAINT "operadores_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rol_permisos_ruta" ADD CONSTRAINT "rol_permisos_ruta_rol_id_roles_id_fk" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rol_permisos_ruta" ADD CONSTRAINT "rol_permisos_ruta_ruta_modulo_id_rutas_modulo_id_fk" FOREIGN KEY ("ruta_modulo_id") REFERENCES "public"."rutas_modulo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campo_geocerca_idx" ON "campo_geocercas" USING btree ("campo_id");--> statement-breakpoint
CREATE INDEX "campos_org_idx" ON "campos" USING btree ("organizacion_id");--> statement-breakpoint
CREATE INDEX "campos_parent_idx" ON "campos" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "asignacion_flota_activa_idx" ON "asignacion_flota" USING btree ("flota_id","fecha_fin");--> statement-breakpoint
CREATE INDEX "asignacion_operador_idx" ON "asignacion_flota" USING btree ("operador_id");--> statement-breakpoint
CREATE INDEX "gastos_flota_fecha_idx" ON "gastos_flota" USING btree ("flota_id","fecha");--> statement-breakpoint
CREATE INDEX "frontend_backend_route_idx" ON "rutas_frontend_backend" USING btree ("frontend_route_id","backend_route_id");--> statement-breakpoint
CREATE UNIQUE INDEX "frontend_backend_route_unique_idx" ON "rutas_frontend_backend" USING btree ("frontend_route_id","backend_route_id");--> statement-breakpoint
CREATE INDEX "combustible_flota_fecha_idx" ON "registros_combustible" USING btree ("flota_id","fecha");--> statement-breakpoint
CREATE INDEX "inspecciones_flota_fecha_idx" ON "inspecciones" USING btree ("flota_id","created_at");--> statement-breakpoint
CREATE INDEX "historial_mant_flota_fecha_idx" ON "historial_mantenimientos" USING btree ("flota_id","fecha");--> statement-breakpoint
CREATE INDEX "mantenimiento_flota_idx" ON "mantenimientos_programados" USING btree ("flota_id");--> statement-breakpoint
CREATE INDEX "operadores_org_idx" ON "operadores" USING btree ("organizacion_id");--> statement-breakpoint
CREATE INDEX "rol_ruta_idx" ON "rol_permisos_ruta" USING btree ("rol_id","ruta_modulo_id");--> statement-breakpoint
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flotas" ADD CONSTRAINT "flotas_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "geocercas" ADD CONSTRAINT "geocercas_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gps_alerta" ADD CONSTRAINT "gps_alerta_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuario_roles" ADD CONSTRAINT "usuario_roles_organizacion_id_organizaciones_id_fk" FOREIGN KEY ("organizacion_id") REFERENCES "public"."organizaciones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rutas_modulo_capacidad_idx" ON "rutas_modulo" USING btree ("capacidad_clave");--> statement-breakpoint
CREATE INDEX "usuario_rol_org_idx" ON "usuario_roles" USING btree ("user_id","organizacion_id");--> statement-breakpoint
CREATE INDEX "rutas_modulo_idx" ON "rutas_modulo" USING btree ("tipo_ruta","url");--> statement-breakpoint
ALTER TABLE "rutas_modulo" DROP COLUMN "modulo_id";--> statement-breakpoint
ALTER TABLE "rutas_modulo" DROP COLUMN "patron_ruta";--> statement-breakpoint
ALTER TABLE "rutas_modulo" DROP COLUMN "tipo_match";--> statement-breakpoint
ALTER TABLE "rutas_modulo" DROP COLUMN "prioridad";--> statement-breakpoint
ALTER TABLE "rutas_modulo" DROP COLUMN "activo";