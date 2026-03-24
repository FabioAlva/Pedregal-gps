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



export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

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
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

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
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);


export const fleetStatus = pgEnum('estado_flotas', [
  'OPERATIVO',
  'CON_OBSERVACIONES',
  'NO_OPERATIVO',
  'EN_REPARACION'
])

// Flotas
export const fleet = pgTable('flotas', {
  id: serial('id').notNull().primaryKey(),
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
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date())
})

// Catálogos de equipos
export const equipmentType = pgTable('tipo_equipos', {
  id: serial('id').notNull().primaryKey(),
  nombre: text('nombre').notNull().unique(),
  descripcion: text('descripcion'),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date())
})

export const equipmentStatus = pgTable('estado_equipos', {
  id: serial('id').notNull().primaryKey(),
  nombre: text('nombre').notNull().unique(),
  disponible: boolean('disponible').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date())
})

// Equipos GPS
export const equipment = pgTable('equipos', {
  id: serial('id').notNull().primaryKey(),
  codigo: text('codigo').notNull().unique(),
  nombre: text('nombre').notNull(),
  modelo: text('modelo'),
  marca: text('marca'),
  tipoId: integer('tipo_id').notNull().references(() => equipmentType.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  estadoId: integer('estado_id').notNull().references(() => equipmentStatus.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  especificaciones: jsonb('especificaciones'),
  proximoMantenimiento: timestamp('proximo_mantenimiento', { precision: 3 }),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date())
})

// Asignación equipo <-> flota
export const fleetEquipment = pgTable('equipo_en_flotas', {
  id: serial('id').notNull().primaryKey(),
  flotaId: integer('flota_id').notNull().references(() => fleet.id, { onDelete: 'cascade' }),
  equipoId: integer('equipo_id').notNull().references(() => equipment.id, { onDelete: 'cascade' }),
  instaladoEl: timestamp('instalado_el').notNull().defaultNow(),
  retiradoEl: timestamp('retirado_el')
})

// Geocercas
export const geofences = pgTable('geocercas', {
  id: serial().primaryKey().notNull(),
  nombre: text().notNull(),
  configuracion: jsonb().default({}).notNull(),
  color: text().default('#3b82f6').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }),
  tipo: text().default('polygon').notNull(),
  coords: jsonb().$type<[number, number] | any[]>().default([]).notNull(),
  radius: integer()
})

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
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date())
})

// Alertas GPS
export const gpsAlerts = pgTable('gps_alerta', {
  id: serial('id').notNull().primaryKey(),
  descripcion: text('descripcion').notNull(),
  limiteValor: integer('limite_valor').notNull(),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow()
})

// Logs alertas GPS
export const gpsAlertLogs = pgTable('gps_alerta_logs', {
  id: serial('id').notNull().primaryKey(),
  alertaId: integer('alerta_id').notNull().references(() => gpsAlerts.id, { onDelete: 'cascade' }),
  fleetEquipmentId: integer('fleet_equipment_id').notNull().references(() => fleetEquipment.id, { onDelete: 'cascade' }),
  valorRegistrado: integer('valor_registrado').notNull(),
  limiteVigente: integer('limite_vigente').notNull(),
  lat: doublePrecision('lat'),
  lng: doublePrecision('lng'),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow()
})

export const roles = pgTable('roles', {
  id: serial('id').primaryKey().notNull(),
  nombre: text('nombre').notNull().unique(),
  descripcion: text('descripcion'),
  activo: boolean('activo').notNull().default(true),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date())
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
  updatedAt: timestamp('updated_at', { precision: 3 }).$onUpdate(() => new Date())
}, (table) => [
  index('rutas_modulo_idx').on(table.tipoRuta, table.url),
  index('rutas_modulo_capacidad_idx').on(table.capacidadClave)
])

// Legacy alias kept to avoid breaking imports while other files migrate.
export const sectionRoutes = moduleRoutes

export const roleRoutePermissions = pgTable('rol_permisos_ruta', {
  id: serial('id').primaryKey().notNull(),
  rolId: integer('rol_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  rutaModuloId: integer('ruta_modulo_id').notNull().references(() => moduleRoutes.id, { onDelete: 'cascade' }),
  ver: boolean('ver').notNull().default(false),
  agregar: boolean('agregar').notNull().default(false),
  editar: boolean('editar').notNull().default(false),
  eliminar: boolean('eliminar').notNull().default(false),
}, (table) => [
  index('rol_ruta_idx').on(table.rolId, table.rutaModuloId)
])

export const frontendBackendRouteLinks = pgTable('rutas_frontend_backend', {
  id: serial('id').primaryKey().notNull(),
  frontendRouteId: integer('frontend_route_id').notNull().references(() => moduleRoutes.id, { onDelete: 'cascade' }),
  backendRouteId: integer('backend_route_id').notNull().references(() => moduleRoutes.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { precision: 3 }).notNull().defaultNow()
}, (table) => [
  index('frontend_backend_route_idx').on(table.frontendRouteId, table.backendRouteId),
  uniqueIndex('frontend_backend_route_unique_idx').on(table.frontendRouteId, table.backendRouteId)
])

export const userRoles = pgTable('usuario_roles', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  rolId: integer('rol_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  asignadoEl: timestamp('asignado_el').notNull().defaultNow(),
}, (table) => [
  index('usuario_rol_idx').on(table.userId)
])

export const rolesRelations = relations(roles, ({ many }) => ({
  permisosRuta: many(roleRoutePermissions),
  usuarios: many(userRoles)
}))

export const moduleRoutesRelations = relations(moduleRoutes, ({ many }) => ({
  frontendLinks: many(frontendBackendRouteLinks, { relationName: 'frontend_route_links' }),
  backendLinks: many(frontendBackendRouteLinks, { relationName: 'backend_route_links' })
}))

// Legacy alias kept to avoid breaking imports while other files migrate.
export const sectionRoutesRelations = moduleRoutesRelations

export const roleRoutePermissionsRelations = relations(roleRoutePermissions, ({ one }) => ({
  rol: one(roles, { fields: [roleRoutePermissions.rolId], references: [roles.id] }),
  ruta: one(moduleRoutes, { fields: [roleRoutePermissions.rutaModuloId], references: [moduleRoutes.id] })
}))

export const frontendBackendRouteLinksRelations = relations(frontendBackendRouteLinks, ({ one }) => ({
  frontendRoute: one(moduleRoutes, {
    fields: [frontendBackendRouteLinks.frontendRouteId],
    references: [moduleRoutes.id],
    relationName: 'frontend_route_links'
  }),
  backendRoute: one(moduleRoutes, {
    fields: [frontendBackendRouteLinks.backendRouteId],
    references: [moduleRoutes.id],
    relationName: 'backend_route_links'
  })
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(user, { fields: [userRoles.userId], references: [user.id] }),
  rol: one(roles, { fields: [userRoles.rolId], references: [roles.id] })
}))

// Relations
export const fleetRelations = relations(fleet, ({ many }) => ({
  equipos: many(fleetEquipment)
}))

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  tipo: one(equipmentType, {
    fields: [equipment.tipoId],
    references: [equipmentType.id]
  }),
  estado: one(equipmentStatus, {
    fields: [equipment.estadoId],
    references: [equipmentStatus.id]
  }),
  flotas: many(fleetEquipment)
}))

export const equipmentTypeRelations = relations(equipmentType, ({ many }) => ({
  equipos: many(equipment)
}))

export const equipmentStatusRelations = relations(equipmentStatus, ({ many }) => ({
  equipos: many(equipment)
}))

export const fleetEquipmentRelations = relations(fleetEquipment, ({ one, many }) => ({
  flota: one(fleet, { fields: [fleetEquipment.flotaId], references: [fleet.id] }),
  equipo: one(equipment, { fields: [fleetEquipment.equipoId], references: [equipment.id] }),
  geofenceStays: many(geofenceStays),
  gpsAlertLogs: many(gpsAlertLogs)
}))

export const geofencesRelations = relations(geofences, ({ many }) => ({
  stays: many(geofenceStays)
}))

export const geofenceStaysRelations = relations(geofenceStays, ({ one }) => ({
  geofence: one(geofences, {
    fields: [geofenceStays.geofenceId],
    references: [geofences.id]
  }),
  fleetEquipment: one(fleetEquipment, {
    fields: [geofenceStays.fleetEquipmentId],
    references: [fleetEquipment.id]
  })
}))

export const gpsAlertsRelations = relations(gpsAlerts, ({ many }) => ({
  logs: many(gpsAlertLogs)
}))

export const gpsAlertLogsRelations = relations(gpsAlertLogs, ({ one }) => ({
  alerta: one(gpsAlerts, {
    fields: [gpsAlertLogs.alertaId],
    references: [gpsAlerts.id]
  }),
  fleetEquipment: one(fleetEquipment, {
    fields: [gpsAlertLogs.fleetEquipmentId],
    references: [fleetEquipment.id]
  })
}))


export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));