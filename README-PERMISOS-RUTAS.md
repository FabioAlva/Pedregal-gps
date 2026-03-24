# Resumen y Checklist de Permisos por Rutas

Este documento es para validar rapido si la configuracion de permisos y relaciones frontend-backend esta funcionando como se espera.

## Modelo actual

- El control de acceso es por ruta, no por modulo.
- Una ruta frontend puede relacionarse con varios endpoints backend.
- La relacion se edita desde la ruta frontend en la pantalla de configuracion.
- Para autorizar un endpoint backend se evalua:
  - Permiso de accion en el endpoint backend (ver/agregar/editar/eliminar).
  - Permiso ver en al menos una ruta frontend relacionada.

## Regla importante

Para que un endpoint backend permita una accion, deben cumplirse ambas condiciones:

1. El usuario tiene permiso de la accion requerida en la ruta backend.
2. El usuario tiene permiso ver en alguna pagina frontend relacionada con ese backend.

Si quitas ver en la pagina frontend relacionada, el backend tambien queda bloqueado para ese usuario, aunque tenga el permiso en backend.

## Inicio de sesion y ruta de entrada

- El sistema ya no redirige siempre a /gps.
- Despues de login, redirige a la primera ruta frontend donde el usuario tenga permiso ver.
- Si no tiene ver en ninguna ruta frontend protegida, se queda en login con aviso de falta de acceso.

## Rutas frontend clave

- /gps
- /gps/report
- /gps/report/analisis-trayectos
- /gps/area-stays
- /gps/team-fleet
- /gps/alert/config-alert
- /gps/alert/historial-alertas
- /configuracion/roles

## Endpoints backend cargados en seed

### Mapa y geocercas
- /api/map/route (POST)
- /api/geofence (GET, POST)
- /api/geofence/* (GET, PATCH, DELETE)

### Reportes
- /api/map/distance (POST)
- /api/map/speed (POST)
- /api/map/stops (POST)
- /api/map/route-analysis (POST)
- /api/geofence-stays/report (POST)

### Team fleet
- /api/equipament (GET, POST)
- /api/equipament/* (PUT)
- /api/fleets (GET)
- /api/fleets/available (GET)
- /api/equipamentFeet (GET, POST)
- /api/equipamentFeet/active (GET)
- /api/equipamentFeet/* (PATCH)

### Alertas
- /api/gps-alert (GET, POST)
- /api/gps-alert/* (GET, PATCH, DELETE)
- /api/gps-alert-logs (GET)
- /api/gps-alert-logs/by-alert/* (GET)
- /api/gps-alert-logs/by-equipment/* (GET)

### Configuracion
- /api/roles (GET, POST)
- /api/roles/* (GET, PATCH, DELETE)
- /api/roles/*/route-permissions (GET, PUT)
- /api/users (GET, POST)
- /api/users/* (PATCH)
- /api/users/*/roles (GET, PUT)

## Checklist de verificacion funcional

### 1) Seed y catalogo
- [ ] Ejecutar seed sin errores.
- [ ] Verificar que existen rutas frontend y backend en configuracion.
- [ ] Verificar que las relaciones ya aparecen pre-cargadas.

### 2) Prueba base de frontend->backend
- [ ] Dar permiso ver a frontend /gps/report.
- [ ] Dar permiso ver a backend /api/map/distance (POST).
- [ ] Relacionar /gps/report con /api/map/distance (POST).
- [ ] Confirmar que el usuario puede consultar el reporte.

### 3) Bloqueo por quitar ver en frontend
- [ ] Mantener backend.ver en true para /api/map/distance (POST).
- [ ] Quitar frontend.ver en /gps/report.
- [ ] Confirmar que el endpoint backend queda denegado para ese usuario.

### 4) Bloqueo por accion backend
- [ ] Dejar frontend.ver en /gps/alert/config-alert.
- [ ] Relacionar con /api/gps-alert/* (PATCH).
- [ ] Quitar backend.editar en esa ruta backend.
- [ ] Confirmar que editar alerta falla por permisos.

### 5) Relacion faltante
- [ ] Dar frontend.ver y backend.ver para una combinacion.
- [ ] Quitar la relacion frontend->backend.
- [ ] Confirmar que se deniega por falta de relacion.

### 6) Roles y usuarios
- [ ] En /configuracion/roles, asignar roles a un usuario.
- [ ] Cerrar sesion e iniciar con ese usuario.
- [ ] Confirmar que solo ve y ejecuta lo permitido.

## Diagnostico rapido si algo falla

1. Revisar si la ruta frontend correcta tiene permiso ver.
2. Revisar si el endpoint backend correcto tiene la accion requerida.
3. Revisar si existe la relacion frontend->backend.
4. Revisar que el usuario tenga el rol correcto asignado.
5. Re-correr seed si faltan rutas base.

## Comandos utiles

- Ejecutar seed:
  - pnpm tsx server/db/seed/seed.ts

- Levantar app en desarrollo:
  - pnpm dev

## Archivos clave para revisar

- app/pages/configuracion/roles.vue
- server/utils/permissions.ts
- server/db/seed/section-routes.seed.ts
- server/db/seed/seed.ts
