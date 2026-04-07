import { relations } from 'drizzle-orm'
import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  index,
  uniqueIndex,
  timestamp
} from 'drizzle-orm/pg-core'

// ─────────────────────────────────────────────────────────────
// AUTH (better-auth — no tocar)
// ─────────────────────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
)

// ─────────────────────────────────────────────────────────────
// ORGANIZACIÓN
// ─────────────────────────────────────────────────────────────

export const organizations = pgTable('organizaciones', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  ruc: text('ruc').unique(),
  logoUrl: text('logo_url'),
  direccion: text('direccion'),
  telefono: text('telefono'),
  centroMapa: jsonb('centro_mapa').$type<[number, number] | null>(),
  limiteMapa: jsonb('limite_mapa').$type<[number, number][]>().default([]),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
})

// ─────────────────────────────────────────────────────────────
// CAMPOS / PARCELAS (jerarquía auto-referenciada)
// Hacienda → Campo → Lote → Parcela
// ─────────────────────────────────────────────────────────────

export const fields = pgTable('campos', {
  id: serial('id').primaryKey(),
  organizacionId: integer('organizacion_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // null = nivel raíz. FK real se añade vía migración SQL (auto-ref circular)
  parentId: integer('parent_id'),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  categoria: text('categoria')
    .$type<'FUNDO' | 'CAMPO' | 'LOTE' | 'PARCELA'>()
    .notNull()
    .default('CAMPO'),
  coords: jsonb('coords').$type<[number, number][]>().default([]),
  areaTotalHa: doublePrecision('area_total_ha'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
}, (table) => [
  index('campos_org_idx').on(table.organizacionId),
  index('campos_parent_idx').on(table.parentId),
])

// ─────────────────────────────────────────────────────────────
// ROLES Y PERMISOS
// ─────────────────────────────────────────────────────────────

export const roles = pgTable('roles', {
  id: serial('id').primaryKey().notNull(),
  organizacionId: integer('organizacion_id')
    .references(() => organizations.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull().unique(),
  descripcion: text('descripcion'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
})

export const moduleRoutes = pgTable('rutas_modulo', {
  id: serial('id').primaryKey().notNull(),
  nombre: text('nombre').notNull().default(''),
  url: text('url').notNull(),
  tipoRuta: text('tipo_ruta').$type<'frontend' | 'backend'>().notNull().default('frontend'),
  metodo: text('metodo'),
  capacidadClave: text('capacidad_clave').notNull(),
  accionRequerida: text('accion_requerida').$type<'ver' | 'agregar' | 'editar' | 'eliminar' | null>(),
  protegida: boolean('protegida').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
}, (table) => [
  index('rutas_modulo_idx').on(table.tipoRuta, table.url),
  index('rutas_modulo_capacidad_idx').on(table.capacidadClave),
])

export const sectionRoutes = moduleRoutes // legacy alias

export const roleRoutePermissions = pgTable('rol_permisos_ruta', {
  id: serial('id').primaryKey().notNull(),
  rolId: integer('rol_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  rutaModuloId: integer('ruta_modulo_id').notNull().references(() => moduleRoutes.id, { onDelete: 'cascade' }),
  ver: boolean('ver').notNull().default(false),
  agregar: boolean('agregar').notNull().default(false),
  editar: boolean('editar').notNull().default(false),
  eliminar: boolean('eliminar').notNull().default(false),
}, (table) => [
  index('rol_ruta_idx').on(table.rolId, table.rutaModuloId),
])

export const frontendBackendRouteLinks = pgTable('rutas_frontend_backend', {
  id: serial('id').primaryKey().notNull(),
  frontendRouteId: integer('frontend_route_id').notNull().references(() => moduleRoutes.id, { onDelete: 'cascade' }),
  backendRouteId: integer('backend_route_id').notNull().references(() => moduleRoutes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
}, (table) => [
  index('frontend_backend_route_idx').on(table.frontendRouteId, table.backendRouteId),
  uniqueIndex('frontend_backend_route_unique_idx').on(table.frontendRouteId, table.backendRouteId),
])

export const userRoles = pgTable('usuario_roles', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  rolId: integer('rol_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  organizacionId: integer('organizacion_id')
    .references(() => organizations.id, { onDelete: 'cascade' }),
  asignadoEl: timestamp('asignado_el').notNull().defaultNow(),
}, (table) => [
  index('usuario_rol_idx').on(table.userId),
  index('usuario_rol_org_idx').on(table.userId, table.organizacionId),
])

// ─────────────────────────────────────────────────────────────
// EQUIPOS GPS / IoT
// ─────────────────────────────────────────────────────────────

export const equipmentType = pgTable('tipo_equipos', {
  id: serial('id').notNull().primaryKey(),
  nombre: text('nombre').notNull().unique(),
  descripcion: text('descripcion'),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
})

export const equipmentStatus = pgTable('estado_equipos', {
  id: serial('id').notNull().primaryKey(),
  nombre: text('nombre').notNull().unique(),
  disponible: boolean('disponible').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
})

export const equipment = pgTable('equipos', {
  id: serial('id').notNull().primaryKey(),
  organizacionId: integer('organizacion_id')
    .references(() => organizations.id, { onDelete: 'set null' }),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  modelo: text('modelo'),
  marca: text('marca'),
  tipoId: integer('tipo_id').notNull().references(() => equipmentType.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  estadoId: integer('estado_id').notNull().references(() => equipmentStatus.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  especificaciones: jsonb('especificaciones'),
  proximoMantenimiento: timestamp('proximo_mantenimiento', { precision: 3 }),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
})

// ─────────────────────────────────────────────────────────────
// FLOTAS
// ─────────────────────────────────────────────────────────────

export const fleetStatus = pgEnum('estado_flotas', [
  'OPERATIVO',
  'CON_OBSERVACIONES',
  'NO_OPERATIVO',
  'EN_REPARACION',
])

export const fleet = pgTable('flotas', {
  id: serial('id').notNull().primaryKey(),
  organizacionId: integer('organizacion_id')
    .references(() => organizations.id, { onDelete: 'set null' }),
  anho: integer('anho').notNull(),
  estado: fleetStatus('estado').notNull().default('OPERATIVO'),
  marca: text('marca').notNull(),
  modelo: text('modelo').notNull(),
  placa: text('placa').notNull().unique(),
  vencimientoSoat: timestamp('vencimiento_soat', { precision: 3 }).notNull(),
  urlSoatPdf: text('url_soat_pdf'),
  urlFotoUnidad: text('url_foto_unidad'),
  urlTarjetaPdf: text('url_tarjeta_pdf'),
  urlTecnicaPdf: text('url_tecnica_pdf'),
  vencimientoTecnica: timestamp('vencimiento_tecnica', { precision: 3 }),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
})

// Asignación equipo GPS <-> flota
export const fleetEquipment = pgTable('equipo_en_flotas', {
  id: serial('id').notNull().primaryKey(),
  flotaId: integer('flota_id').notNull().references(() => fleet.id, { onDelete: 'cascade' }),
  equipoId: integer('equipo_id').notNull().references(() => equipment.id, { onDelete: 'cascade' }),
  instaladoEl: timestamp('instalado_el').notNull().defaultNow(),
  retiradoEl: timestamp('retirado_el'),
})

// ─────────────────────────────────────────────────────────────
// IMPLEMENTOS
// ─────────────────────────────────────────────────────────────

export const implementsTable = pgTable('implementos', {
  id: serial('id').primaryKey(),
  organizacionId: integer('organizacion_id')
    .references(() => organizations.id, { onDelete: 'set null' }),
  flotaId: integer('flota_id')
    .references(() => fleet.id, { onDelete: 'set null' }),
  nombre: text('nombre').notNull(),
  tipo: text('tipo').notNull(),
  serie: text('serie').unique(),
  estado: text('estado')
    .$type<'OPERATIVO' | 'EN_REPARACION' | 'INACTIVO'>()
    .notNull()
    .default('OPERATIVO'),
  descripcion: text('descripcion'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
}, (table) => [
  index('implementos_flota_idx').on(table.flotaId),
])

// ─────────────────────────────────────────────────────────────
// GEOCERCAS
// ─────────────────────────────────────────────────────────────

export const geofences = pgTable('geocercas', {
  id: serial().primaryKey().notNull(),
  organizacionId: integer('organizacion_id')
    .references(() => organizations.id, { onDelete: 'cascade' }),
  nombre: text().notNull(),
  configuracion: jsonb().default({}).notNull(),
  color: text().default('#3b82f6').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  tipo: text().default('polygon').notNull(),
  coords: jsonb().$type<[number, number] | any[]>().default([]).notNull(),
  radius: integer(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }),
})

// Vincula una geocerca a un campo/parcela (opcional)
export const fieldGeofences = pgTable('campo_geocercas', {
  id: serial('id').primaryKey(),
  campoId: integer('campo_id').notNull().references(() => fields.id, { onDelete: 'cascade' }),
  geocercaId: integer('geocerca_id').notNull().references(() => geofences.id, { onDelete: 'cascade' }),
  esPerimetro: boolean('es_perimetro').notNull().default(false),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
}, (table) => [
  index('campo_geocerca_idx').on(table.campoId),
])

// Estancias por geocerca
export const geofenceStays = pgTable('geofence_stays', {
  id: serial('id').notNull().primaryKey(),
  geofenceId: integer('geofence_id').notNull().references(() => geofences.id, { onDelete: 'cascade' }),
  fleetEquipmentId: integer('fleet_equipment_id').notNull().references(() => fleetEquipment.id, { onDelete: 'cascade' }),
  enteredAt: timestamp('entered_at', { precision: 3 }).notNull(),
  exitedAt: timestamp('exited_at', { precision: 3 }),
  entryLat: doublePrecision('entry_lat'),
  entryLng: doublePrecision('entry_lng'),
  exitLat: doublePrecision('exit_lat'),
  exitLng: doublePrecision('exit_lng'),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
})

// ─────────────────────────────────────────────────────────────
// ALERTAS GPS
// ─────────────────────────────────────────────────────────────

export const gpsAlerts = pgTable('gps_alerta', {
  id: serial('id').notNull().primaryKey(),
  organizacionId: integer('organizacion_id')
    .references(() => organizations.id, { onDelete: 'cascade' }),
  descripcion: text('descripcion').notNull(),
  limiteValor: integer('limite_valor').notNull(),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
})

export const gpsAlertLogs = pgTable('gps_alerta_logs', {
  id: serial('id').notNull().primaryKey(),
  alertaId: integer('alerta_id').notNull().references(() => gpsAlerts.id, { onDelete: 'cascade' }),
  fleetEquipmentId: integer('fleet_equipment_id').notNull().references(() => fleetEquipment.id, { onDelete: 'cascade' }),
  valorRegistrado: integer('valor_registrado').notNull(),
  limiteVigente: integer('limite_vigente').notNull(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
})

// ─────────────────────────────────────────────────────────────
// OPERADORES
// ─────────────────────────────────────────────────────────────

export const operators = pgTable('operadores', {
  id: serial('id').primaryKey(),
  organizacionId: integer('organizacion_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // Link opcional al sistema de login
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  nombres: text('nombres').notNull(),
  apellidos: text('apellidos').notNull(),
  dni: text('dni').unique(),
  licencia: text('licencia'),
  categoriaLicencia: text('categoria_licencia'),
  vencimientoLicencia: timestamp('vencimiento_licencia', { precision: 3 }),
  telefono: text('telefono'),
  fotoUrl: text('foto_url'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
}, (table) => [
  index('operadores_org_idx').on(table.organizacionId),
])

// ─────────────────────────────────────────────────────────────
// ASIGNACIÓN FLOTA <-> OPERADOR
// ─────────────────────────────────────────────────────────────

export const fleetAssignments = pgTable('asignacion_flota', {
  id: serial('id').primaryKey(),
  flotaId: integer('flota_id').notNull().references(() => fleet.id, { onDelete: 'cascade' }),
  operadorId: integer('operador_id').notNull().references(() => operators.id, { onDelete: 'restrict' }),
  fechaInicio: timestamp('fecha_inicio', { precision: 3 }).notNull().defaultNow(),
  fechaFin: timestamp('fecha_fin', { precision: 3 }),
  kmInicial: integer('km_inicial'),
  kmFinal: integer('km_final'),
  horasInicial: doublePrecision('horas_inicial'),
  horasFinal: doublePrecision('horas_final'),
  estadoEntrega: text('estado_entrega').$type<'BUENO' | 'REGULAR' | 'MALO'>(),
  estadoDevolucion: text('estado_devolucion').$type<'BUENO' | 'REGULAR' | 'MALO'>(),
  fotosEntrega: jsonb('fotos_entrega').$type<string[]>().default([]),
  fotosDevolucion: jsonb('fotos_devolucion').$type<string[]>().default([]),
  observaciones: text('observaciones'),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
}, (table) => [
  // Índice compuesto para consultar asignación activa rápidamente (fechaFin IS NULL)
  index('asignacion_flota_activa_idx').on(table.flotaId, table.fechaFin),
  index('asignacion_operador_idx').on(table.operadorId),
])

// ─────────────────────────────────────────────────────────────
// GASTOS
// ─────────────────────────────────────────────────────────────

// Tabla catálogo en vez de enum → el usuario puede agregar categorías sin migración
export const expenseCategories = pgTable('categorias_gasto', {
  id: serial('id').primaryKey(),
  organizacionId: integer('organizacion_id')
    .references(() => organizations.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  // Distingue si es combustible para mostrarlo diferente en reportes
  esCombustible: boolean('es_combustible').notNull().default(false),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
})

export const fleetExpenses = pgTable('gastos_flota', {
  id: serial('id').primaryKey(),
  flotaId: integer('flota_id').notNull().references(() => fleet.id, { onDelete: 'cascade' }),
  categoriaId: integer('categoria_id').notNull().references(() => expenseCategories.id),
  operadorId: integer('operador_id').references(() => operators.id, { onDelete: 'set null' }),
  monto: doublePrecision('monto').notNull(),
  fecha: timestamp('fecha', { precision: 3 }).notNull().defaultNow(),
  descripcion: text('descripcion'),
  // Metadatos flexibles según categoría:
  // Combustible → {
  //   fuelEntryDate, vendorName, reference,
  //   flags: { personal, partialFuelUp, resetUsage },
  //   photos, comments
  // }
  // Otros → { vendorName, reference, details, photos, comments }
  metadatos: jsonb('metadatos').$type<Record<string, unknown>>().default({}),
  comprobantesUrl: jsonb('comprobantes_url').$type<string[]>().default([]),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
}, (table) => [
  index('gastos_flota_fecha_idx').on(table.flotaId, table.fecha),
])

// ─────────────────────────────────────────────────────────────
// COMBUSTIBLE (separado por sus campos únicos)
// Referencia al gasto para no duplicar el monto en reportes
// ─────────────────────────────────────────────────────────────

export const fuelLogs = pgTable('registros_combustible', {
  id: serial('id').primaryKey(),
  flotaId: integer('flota_id').notNull().references(() => fleet.id, { onDelete: 'cascade' }),
  operadorId: integer('operador_id').references(() => operators.id, { onDelete: 'set null' }),
  // FK al gasto para no duplicar el monto
  gastoId: integer('gasto_id').references(() => fleetExpenses.id, { onDelete: 'set null' }),
  galones: doublePrecision('galones').notNull(),
  precioGalon: doublePrecision('precio_galon'),
  odometroKm: doublePrecision('odometro_km'),
  horasMotor: doublePrecision('horas_motor'),
  proveedor: text('proveedor'),
  tipoCombustible: text('tipo_combustible')
    .$type<'DIESEL' | 'GASOLINA' | 'GAS'>()
    .default('DIESEL'),
  fotosUrl: jsonb('fotos_url').$type<string[]>().default([]),
  fecha: timestamp('fecha', { precision: 3 }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
}, (table) => [
  index('combustible_flota_fecha_idx').on(table.flotaId, table.fecha),
])

// ─────────────────────────────────────────────────────────────
// INSPECCIONES (DVIR)
// ─────────────────────────────────────────────────────────────

export const inspectionTemplates = pgTable('plantillas_inspeccion', {
  id: serial('id').primaryKey(),
  organizacionId: integer('organizacion_id')
    .references(() => organizations.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  // Estructura de la plantilla:
  // [{ id: 'frenos', label: 'Frenos', tipo: 'boolean'|'texto'|'foto'|'numero'|'seleccion',
  //    opciones?: string[], requerido: boolean, alertaSi?: boolean }]
  esquema: jsonb('esquema').$type<{
    id: string
    label: string
    tipo: 'boolean' | 'texto' | 'foto' | 'numero' | 'seleccion'
    opciones?: string[]
    requerido: boolean
    alertaSi?: boolean
  }[]>().notNull(),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
})

export const inspections = pgTable('inspecciones', {
  id: serial('id').primaryKey(),
  flotaId: integer('flota_id').notNull().references(() => fleet.id, { onDelete: 'cascade' }),
  operadorId: integer('operador_id').references(() => operators.id, { onDelete: 'set null' }),
  plantillaId: integer('plantilla_id').references(() => inspectionTemplates.id, { onDelete: 'set null' }),
  // Snapshot del esquema al momento de firmar (si la plantilla cambia, el historial queda íntegro)
  esquemaSnapshot: jsonb('esquema_snapshot'),
  // { [campo.id]: valor | url_foto }
  respuestas: jsonb('respuestas').$type<Record<string, unknown>>().notNull(),
  estado: text('estado').$type<'APROBADO' | 'OBSERVADO' | 'CRITICO'>().notNull(),
  tipo: text('tipo').$type<'PRE_USO' | 'POST_USO' | 'PERIODICA'>().default('PRE_USO'),
  firmaUrl: text('firma_url'),
  observaciones: text('observaciones'),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
}, (table) => [
  index('inspecciones_flota_fecha_idx').on(table.flotaId, table.createdAt),
])

export const inspectionIssues = pgTable('problemas_inspeccion', {
  id: serial('id').primaryKey(),
  inspeccionId: integer('inspeccion_id').notNull().references(() => inspections.id, { onDelete: 'cascade' }),
  campoId: text('campo_id').notNull(),
  descripcion: text('descripcion').notNull(),
  severidad: text('severidad').$type<'LEVE' | 'MODERADO' | 'CRITICO'>().notNull(),
  fotosUrl: jsonb('fotos_url').$type<string[]>().default([]),
  resuelto: boolean('resuelto').notNull().default(false),
  // Se llena cuando el problema genera una orden de trabajo
  ordenTrabajoId: integer('orden_trabajo_id'),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
})

// ─────────────────────────────────────────────────────────────
// ALMACEN / REPUESTOS
// ─────────────────────────────────────────────────────────────

export const inventoryParts = pgTable('repuestos', {
  id: serial('id').primaryKey(),
  organizacionId: integer('organizacion_id')
    .references(() => organizations.id, { onDelete: 'set null' }),
  nombre: text('nombre').notNull(),
  sku: text('sku').unique(),
  unidad: text('unidad').default('UND'),
  stockActual: doublePrecision('stock_actual').notNull().default(0),
  stockMinimo: doublePrecision('stock_minimo').notNull().default(0),
  ubicacion: text('ubicacion'),
  descripcion: text('descripcion'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
}, (table) => [
  index('repuestos_org_idx').on(table.organizacionId),
  uniqueIndex('repuestos_sku_idx').on(table.sku),
])

// ─────────────────────────────────────────────────────────────
// MANTENIMIENTOS PROGRAMADOS
// ─────────────────────────────────────────────────────────────

export const maintenanceSchedules = pgTable('mantenimientos_programados', {
  id: serial('id').primaryKey(),
  flotaId: integer('flota_id').notNull().references(() => fleet.id, { onDelete: 'cascade' }),
  nombre: text('nombre').notNull(),
  descripcion: text('descripcion'),
  // Disparadores (puede tener uno o los tres a la vez)
  intervaloKm: integer('intervalo_km'),
  intervaloHoras: integer('intervalo_horas'),
  intervaloDias: integer('intervalo_dias'),
  // Valores del último mantenimiento realizado
  ultimoKm: integer('ultimo_km'),
  ultimasHoras: doublePrecision('ultimas_horas'),
  ultimaFecha: timestamp('ultima_fecha', { precision: 3 }),
  // Próximos estimados (calculados en la app al registrar un log)
  proximaFecha: timestamp('proxima_fecha', { precision: 3 }),
  proximoKm: integer('proximo_km'),
  proximasHoras: doublePrecision('proximas_horas'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date()),
}, (table) => [
  index('mantenimiento_flota_idx').on(table.flotaId),
])

// Historial de ejecuciones de mantenimiento
export const maintenanceLogs = pgTable('historial_mantenimientos', {
  id: serial('id').primaryKey(),
  scheduleId: integer('schedule_id').references(() => maintenanceSchedules.id, { onDelete: 'set null' }),
  flotaId: integer('flota_id').notNull().references(() => fleet.id, { onDelete: 'cascade' }),
  // Gasto asociado (para que aparezca también en reportes de gastos)
  gastoId: integer('gasto_id').references(() => fleetExpenses.id, { onDelete: 'set null' }),
  realizadoPor: text('realizado_por'),
  kmAlRealizar: integer('km_al_realizar'),
  horasAlRealizar: doublePrecision('horas_al_realizar'),
  descripcion: text('descripcion'),
  repuestosUsados: jsonb('repuestos_usados')
    .$type<{ nombre: string; cantidad: number; costo: number }[]>()
    .default([]),
  fotosUrl: jsonb('fotos_url').$type<string[]>().default([]),
  fecha: timestamp('fecha', { precision: 3 }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
}, (table) => [
  index('historial_mant_flota_fecha_idx').on(table.flotaId, table.fecha),
])

// ═════════════════════════════════════════════════════════════
// RELACIONES
// ═════════════════════════════════════════════════════════════

// ─── Auth ────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  roles: many(userRoles),
  operador: many(operators),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

// ─── Organización ────────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  campos: many(fields),
  flotas: many(fleet),
  equipos: many(equipment),
  operadores: many(operators),
  roles: many(roles),
  geocercas: many(geofences),
  alertasGps: many(gpsAlerts),
  plantillasInspeccion: many(inspectionTemplates),
  categoriasGasto: many(expenseCategories),
  implementos: many(implementsTable),
  repuestos: many(inventoryParts),
}))

// ─── Campos / Parcelas ───────────────────────────────────────

export const fieldsRelations = relations(fields, ({ one, many }) => ({
  organizacion: one(organizations, {
    fields: [fields.organizacionId],
    references: [organizations.id],
  }),
  padre: one(fields, {
    fields: [fields.parentId],
    references: [fields.id],
    relationName: 'campo_jerarquia',
  }),
  hijos: many(fields, { relationName: 'campo_jerarquia' }),
  geocercas: many(fieldGeofences),
}))

export const fieldGeofencesRelations = relations(fieldGeofences, ({ one }) => ({
  campo: one(fields, { fields: [fieldGeofences.campoId], references: [fields.id] }),
  geocerca: one(geofences, { fields: [fieldGeofences.geocercaId], references: [geofences.id] }),
}))

// ─── Roles y Permisos ────────────────────────────────────────

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organizacion: one(organizations, { fields: [roles.organizacionId], references: [organizations.id] }),
  permisosRuta: many(roleRoutePermissions),
  usuarios: many(userRoles),
}))

export const moduleRoutesRelations = relations(moduleRoutes, ({ many }) => ({
  frontendLinks: many(frontendBackendRouteLinks, { relationName: 'frontend_route_links' }),
  backendLinks: many(frontendBackendRouteLinks, { relationName: 'backend_route_links' }),
}))

export const sectionRoutesRelations = moduleRoutesRelations // legacy alias

export const roleRoutePermissionsRelations = relations(roleRoutePermissions, ({ one }) => ({
  rol: one(roles, { fields: [roleRoutePermissions.rolId], references: [roles.id] }),
  ruta: one(moduleRoutes, { fields: [roleRoutePermissions.rutaModuloId], references: [moduleRoutes.id] }),
}))

export const frontendBackendRouteLinksRelations = relations(frontendBackendRouteLinks, ({ one }) => ({
  frontendRoute: one(moduleRoutes, {
    fields: [frontendBackendRouteLinks.frontendRouteId],
    references: [moduleRoutes.id],
    relationName: 'frontend_route_links',
  }),
  backendRoute: one(moduleRoutes, {
    fields: [frontendBackendRouteLinks.backendRouteId],
    references: [moduleRoutes.id],
    relationName: 'backend_route_links',
  }),
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(user, { fields: [userRoles.userId], references: [user.id] }),
  rol: one(roles, { fields: [userRoles.rolId], references: [roles.id] }),
  organizacion: one(organizations, { fields: [userRoles.organizacionId], references: [organizations.id] }),
}))

// ─── Equipos GPS ─────────────────────────────────────────────

export const equipmentTypeRelations = relations(equipmentType, ({ many }) => ({
  equipos: many(equipment),
}))

export const equipmentStatusRelations = relations(equipmentStatus, ({ many }) => ({
  equipos: many(equipment),
}))

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  organizacion: one(organizations, { fields: [equipment.organizacionId], references: [organizations.id] }),
  tipo: one(equipmentType, { fields: [equipment.tipoId], references: [equipmentType.id] }),
  estado: one(equipmentStatus, { fields: [equipment.estadoId], references: [equipmentStatus.id] }),
  flotas: many(fleetEquipment),
}))

// ─── Flotas ──────────────────────────────────────────────────

export const fleetRelations = relations(fleet, ({ one, many }) => ({
  organizacion: one(organizations, { fields: [fleet.organizacionId], references: [organizations.id] }),
  equipos: many(fleetEquipment),
  asignaciones: many(fleetAssignments),
  gastos: many(fleetExpenses),
  registrosCombustible: many(fuelLogs),
  inspecciones: many(inspections),
  mantenimientosProgramados: many(maintenanceSchedules),
  historialMantenimientos: many(maintenanceLogs),
  implementos: many(implementsTable),
}))

export const fleetEquipmentRelations = relations(fleetEquipment, ({ one, many }) => ({
  flota: one(fleet, { fields: [fleetEquipment.flotaId], references: [fleet.id] }),
  equipo: one(equipment, { fields: [fleetEquipment.equipoId], references: [equipment.id] }),
  geofenceStays: many(geofenceStays),
  gpsAlertLogs: many(gpsAlertLogs),
}))

// ─── Implementos ─────────────────────────────────────────────

export const implementsRelations = relations(implementsTable, ({ one }) => ({
  organizacion: one(organizations, { fields: [implementsTable.organizacionId], references: [organizations.id] }),
  flota: one(fleet, { fields: [implementsTable.flotaId], references: [fleet.id] }),
}))

// ─── Geocercas ───────────────────────────────────────────────

export const geofencesRelations = relations(geofences, ({ one, many }) => ({
  organizacion: one(organizations, { fields: [geofences.organizacionId], references: [organizations.id] }),
  stays: many(geofenceStays),
  campos: many(fieldGeofences),
}))

export const geofenceStaysRelations = relations(geofenceStays, ({ one }) => ({
  geofence: one(geofences, { fields: [geofenceStays.geofenceId], references: [geofences.id] }),
  fleetEquipment: one(fleetEquipment, { fields: [geofenceStays.fleetEquipmentId], references: [fleetEquipment.id] }),
}))

// ─── Alertas GPS ─────────────────────────────────────────────

export const gpsAlertsRelations = relations(gpsAlerts, ({ one, many }) => ({
  organizacion: one(organizations, { fields: [gpsAlerts.organizacionId], references: [organizations.id] }),
  logs: many(gpsAlertLogs),
}))

export const gpsAlertLogsRelations = relations(gpsAlertLogs, ({ one }) => ({
  alerta: one(gpsAlerts, { fields: [gpsAlertLogs.alertaId], references: [gpsAlerts.id] }),
  fleetEquipment: one(fleetEquipment, { fields: [gpsAlertLogs.fleetEquipmentId], references: [fleetEquipment.id] }),
}))

// ─── Operadores ──────────────────────────────────────────────

export const operatorsRelations = relations(operators, ({ one, many }) => ({
  organizacion: one(organizations, { fields: [operators.organizacionId], references: [organizations.id] }),
  user: one(user, { fields: [operators.userId], references: [user.id] }),
  asignaciones: many(fleetAssignments),
  inspecciones: many(inspections),
  gastos: many(fleetExpenses),
  registrosCombustible: many(fuelLogs),
}))

// ─── Asignaciones ────────────────────────────────────────────

export const fleetAssignmentsRelations = relations(fleetAssignments, ({ one }) => ({
  flota: one(fleet, { fields: [fleetAssignments.flotaId], references: [fleet.id] }),
  operador: one(operators, { fields: [fleetAssignments.operadorId], references: [operators.id] }),
}))

// ─── Gastos ──────────────────────────────────────────────────

export const expenseCategoriesRelations = relations(expenseCategories, ({ one, many }) => ({
  organizacion: one(organizations, { fields: [expenseCategories.organizacionId], references: [organizations.id] }),
  gastos: many(fleetExpenses),
}))

export const fleetExpensesRelations = relations(fleetExpenses, ({ one, many }) => ({
  flota: one(fleet, { fields: [fleetExpenses.flotaId], references: [fleet.id] }),
  categoria: one(expenseCategories, { fields: [fleetExpenses.categoriaId], references: [expenseCategories.id] }),
  operador: one(operators, { fields: [fleetExpenses.operadorId], references: [operators.id] }),
  registroCombustible: many(fuelLogs),
  historialMantenimiento: many(maintenanceLogs),
}))

export const fuelLogsRelations = relations(fuelLogs, ({ one }) => ({
  flota: one(fleet, { fields: [fuelLogs.flotaId], references: [fleet.id] }),
  operador: one(operators, { fields: [fuelLogs.operadorId], references: [operators.id] }),
  gasto: one(fleetExpenses, { fields: [fuelLogs.gastoId], references: [fleetExpenses.id] }),
}))

// ─── Inspecciones ────────────────────────────────────────────

export const inspectionTemplatesRelations = relations(inspectionTemplates, ({ one, many }) => ({
  organizacion: one(organizations, { fields: [inspectionTemplates.organizacionId], references: [organizations.id] }),
  inspecciones: many(inspections),
}))

export const inspectionsRelations = relations(inspections, ({ one, many }) => ({
  flota: one(fleet, { fields: [inspections.flotaId], references: [fleet.id] }),
  operador: one(operators, { fields: [inspections.operadorId], references: [operators.id] }),
  plantilla: one(inspectionTemplates, { fields: [inspections.plantillaId], references: [inspectionTemplates.id] }),
  problemas: many(inspectionIssues),
}))

export const inspectionIssuesRelations = relations(inspectionIssues, ({ one }) => ({
  inspeccion: one(inspections, { fields: [inspectionIssues.inspeccionId], references: [inspections.id] }),
}))

// ─── Repuestos ─────────────────────────────────────────────

export const inventoryPartsRelations = relations(inventoryParts, ({ one }) => ({
  organizacion: one(organizations, { fields: [inventoryParts.organizacionId], references: [organizations.id] }),
}))

// ─── Mantenimientos ──────────────────────────────────────────

export const maintenanceSchedulesRelations = relations(maintenanceSchedules, ({ one, many }) => ({
  flota: one(fleet, { fields: [maintenanceSchedules.flotaId], references: [fleet.id] }),
  historial: many(maintenanceLogs),
}))

export const maintenanceLogsRelations = relations(maintenanceLogs, ({ one }) => ({
  schedule: one(maintenanceSchedules, { fields: [maintenanceLogs.scheduleId], references: [maintenanceSchedules.id] }),
  flota: one(fleet, { fields: [maintenanceLogs.flotaId], references: [fleet.id] }),
  gasto: one(fleetExpenses, { fields: [maintenanceLogs.gastoId], references: [fleetExpenses.id] }),
}))