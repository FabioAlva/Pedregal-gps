# Resumen y Checklist de Permisos por Rutas

Este documento es para validar rapido si la configuracion de permisos y relaciones frontend-backend esta funcionando como se espera.

## Modelo actual

- El control de acceso es por ruta, no por modulo.
- Una ruta frontend puede relacionarse con varios endpoints backend.
- La relacion se edita desde la ruta frontend en la pantalla de configuracion.
- Para autorizar un endpoint backend se evalua:
  - Solo permisos en la ruta frontend relacionada.
  - La accion se deduce por metodo HTTP (GET=ver, POST=agregar o ver, PUT/PATCH=editar, DELETE=eliminar).

## Flujo para crear rutas nuevas

1. Crear la ruta frontend en el modulo de rutas.
2. Crear la ruta backend con el metodo HTTP correcto.
3. Vincular la ruta backend a la frontend.
4. En roles, dar permisos a la ruta frontend (ver/agregar/editar/eliminar).
5. Guardar permisos y probar el endpoint.

Notas:
- POST permite acceso si el frontend tiene `agregar` o `ver`.
- Si la ruta backend no esta vinculada a ninguna frontend, se bloquea.

## Regla importante

Para que un endpoint backend permita una accion, deben cumplirse ambas condiciones:

1. La ruta backend esta vinculada a al menos una ruta frontend.
2. El usuario tiene el permiso requerido en alguna de esas rutas frontend.

Si quitas el permiso en la pagina frontend relacionada, el backend queda bloqueado para ese usuario.

## Inicio de sesion y ruta de entrada

- El sistema ya no redirige siempre a /gps.
- Despues de login, redirige a la primera ruta frontend donde el usuario tenga permiso ver.
- Si no tiene ver en ninguna ruta frontend protegida, se queda en login con aviso de falta de acceso.

## Rutas frontend clave

- /gps
- /gps/geo/fields-list
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
- /api/fields (GET, POST)
- /api/fields/import (POST)
- /api/fields/* (GET, PATCH, DELETE)

### Reportes
- /api/map/distance (POST)
- /api/map/speed (POST)
- /api/map/stops (POST)
- /api/map/route-analysis (POST)
- /api/geofence-stays/report (POST)
- /api/field-stays/report (POST)

### Team fleet
- /api/equipment (GET, POST)
- /api/equipment/* (PUT)
- /api/fleets (GET)
- /api/fleets/available (GET)
- /api/equipmentFeet (GET, POST)
- /api/equipmentFeet/active (GET)
- /api/equipmentFeet/* (PATCH)

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
- [ ] Relacionar /gps/report con /api/map/distance (POST).
- [ ] Confirmar que el usuario puede consultar el reporte (POST admite ver).

### 3) Bloqueo por quitar ver en frontend
- [ ] Mantener backend.ver en true para /api/map/distance (POST).
- [ ] Quitar frontend.ver en /gps/report.
- [ ] Confirmar que el endpoint backend queda denegado para ese usuario.

### 4) Bloqueo por accion (metodo)
- [ ] Dejar frontend.ver en /gps/alert/config-alert.
- [ ] Relacionar con /api/gps-alert/* (PATCH).
- [ ] Quitar frontend.editar en /gps/alert/config-alert.
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

1. Revisar si la ruta frontend correcta tiene el permiso requerido.
2. Revisar si existe la relacion frontend->backend.
3. Revisar que el usuario tenga el rol correcto asignado.
4. Re-correr seed si faltan rutas base.

## Comandos utiles

- Ejecutar seed:
  - pnpm tsx server/db/seed/seed.ts

- Levantar app en desarrollo:
  - pnpm dev

## Archivos clave para revisar

- layers/auth-admin/server/utils/betterauth-permissions.ts
- server/db/seed/section-routes.seed.ts
- server/db/seed/seed.ts
