BEGIN;

-- 1) Validaciones de FK para equipos (tipo_id=1, estado_id=2)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tipo_equipos WHERE id = 1) THEN
    RAISE EXCEPTION 'Falta tipo_equipos.id=1. Crea ese catálogo antes de cargar equipos.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM estado_equipos WHERE id = 2) THEN
    RAISE EXCEPTION 'Falta estado_equipos.id=2. Crea ese catálogo antes de cargar equipos.';
  END IF;
END
$$;

-- 2) Carga de flotas
WITH src AS (
  SELECT *
  FROM jsonb_to_recordset(
    $$[
      {"id":4,"anho":2020,"estado":"OPERATIVO","marca":"MITSUBISHI","modelo":"L200","placa":"P4D-921","vencimiento_soat":"2027-02-21 00:00:00","url_soat_pdf":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/soat/P4D-921-1771598146644.pdf","url_foto_unidad":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/unidades/P4D-921-1771525532173.jpeg","url_tarjeta_pdf":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/tarjeta_propiedad/P4D-921-1771535111693.pdf","url_tecnica_pdf":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/inspeccion_tecnica/P4D-921-1771525532866.pdf","vencimiento_tecnica":"2026-05-21 00:00:00","created_at":"2026-02-26 03:47:31.586","updated_at":null},
      {"id":3,"anho":2026,"estado":"OPERATIVO","marca":"JMC","modelo":"GRAND AVENUE","placa":"P5D-943","vencimiento_soat":"2027-03-06 00:00:00","url_soat_pdf":"/api/blob/serve/soat/1772669082350_142742800-0_CELI_HIDALGO_KARINA_ELIZABETH.pdf","url_foto_unidad":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/unidades/P5D-943-1771536154096.jpeg","url_tarjeta_pdf":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/tarjeta_propiedad/P5D-943-1771536155553.pdf","url_tecnica_pdf":null,"vencimiento_tecnica":null,"created_at":"2026-02-26 03:47:31.494","updated_at":"2026-03-05 18:05:56.241"},
      {"id":2,"anho":2014,"estado":"OPERATIVO","marca":"TOYOTA","modelo":"HILUX","placa":"P2Y-906","vencimiento_soat":"2026-07-04 00:00:00","url_soat_pdf":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/soat/P2Y-906-1771524928946.pdf","url_foto_unidad":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/unidades/P2Y-906-1771524932054.jpg","url_tarjeta_pdf":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/tarjeta_propiedad/P2Y-906-1771535143121.pdf","url_tecnica_pdf":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/inspeccion_tecnica/P2Y-906-1771524932604.pdf","vencimiento_tecnica":"2026-07-21 00:00:00","created_at":"2026-02-26 03:47:31.401","updated_at":"2026-03-03 23:01:15.859"},
      {"id":1,"anho":2025,"estado":"OPERATIVO","marca":"MITSUBISHI","modelo":"L200","placa":"P5F-936","vencimiento_soat":"2026-07-22 00:00:00","url_soat_pdf":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/soat/P5F-936%20-1771525822323.pdf","url_foto_unidad":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/unidades/P5F-936-1771535072069.jpg","url_tarjeta_pdf":"https://eivxtougiekoldtwdetr.supabase.co/storage/v1/object/public/tarjeta_propiedad/P5F-936-1771535073453.pdf","url_tecnica_pdf":null,"vencimiento_tecnica":null,"created_at":"2026-02-26 03:47:31.287","updated_at":"2026-03-06 17:16:57.123"}
    ]$$::jsonb
  ) AS t(
    id int,
    anho int,
    estado text,
    marca text,
    modelo text,
    placa text,
    vencimiento_soat text,
    url_soat_pdf text,
    url_foto_unidad text,
    url_tarjeta_pdf text,
    url_tecnica_pdf text,
    vencimiento_tecnica text,
    created_at text,
    updated_at text
  )
)
INSERT INTO flotas (
  id, anho, estado, marca, modelo, placa,
  vencimiento_soat, url_soat_pdf, url_foto_unidad, url_tarjeta_pdf, url_tecnica_pdf,
  vencimiento_tecnica, created_at, updated_at
)
SELECT
  s.id,
  s.anho,
  s.estado::estado_flotas,
  s.marca,
  s.modelo,
  s.placa,
  s.vencimiento_soat::timestamp,
  s.url_soat_pdf,
  s.url_foto_unidad,
  s.url_tarjeta_pdf,
  s.url_tecnica_pdf,
  NULLIF(s.vencimiento_tecnica, '')::timestamp,
  s.created_at::timestamp,
  NULLIF(s.updated_at, '')::timestamp
FROM src s
ON CONFLICT (id) DO UPDATE SET
  anho = EXCLUDED.anho,
  estado = EXCLUDED.estado,
  marca = EXCLUDED.marca,
  modelo = EXCLUDED.modelo,
  placa = EXCLUDED.placa,
  vencimiento_soat = EXCLUDED.vencimiento_soat,
  url_soat_pdf = EXCLUDED.url_soat_pdf,
  url_foto_unidad = EXCLUDED.url_foto_unidad,
  url_tarjeta_pdf = EXCLUDED.url_tarjeta_pdf,
  url_tecnica_pdf = EXCLUDED.url_tecnica_pdf,
  vencimiento_tecnica = EXCLUDED.vencimiento_tecnica,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

-- 3) Carga de equipos
WITH src AS (
  SELECT *
  FROM jsonb_to_recordset(
    $$[
      {"id":1,"codigo":"869671072459009","nombre":"GPS1","modelo":"FMB920","marca":"Teltonika","tipo_id":1,"estado_id":2,"especificaciones":{"imei":"869671072459009","color":"#00B4D8","topic":"869671072459009/data"},"proximo_mantenimiento":null,"created_at":"2026-03-02 18:08:41.343","updated_at":"2026-03-13 21:21:11.246"},
      {"id":2,"codigo":"863238076323569","nombre":"GPS2","modelo":"FMB120","marca":"Teltonika","tipo_id":1,"estado_id":2,"especificaciones":{"imei":"863238076323569","color":"#025c95","topic":"863238076323569/data"},"proximo_mantenimiento":null,"created_at":"2026-03-02 18:08:41.343","updated_at":"2026-03-17 17:46:51.081"}
    ]$$::jsonb
  ) AS t(
    id int,
    codigo text,
    nombre text,
    modelo text,
    marca text,
    tipo_id int,
    estado_id int,
    especificaciones jsonb,
    proximo_mantenimiento text,
    created_at text,
    updated_at text
  )
)
INSERT INTO equipos (
  id, codigo, nombre, modelo, marca, tipo_id, estado_id,
  especificaciones, proximo_mantenimiento, created_at, updated_at
)
SELECT
  s.id,
  s.codigo,
  s.nombre,
  s.modelo,
  s.marca,
  s.tipo_id,
  s.estado_id,
  s.especificaciones,
  NULLIF(s.proximo_mantenimiento, '')::timestamp,
  s.created_at::timestamp,
  NULLIF(s.updated_at, '')::timestamp
FROM src s
ON CONFLICT (id) DO UPDATE SET
  codigo = EXCLUDED.codigo,
  nombre = EXCLUDED.nombre,
  modelo = EXCLUDED.modelo,
  marca = EXCLUDED.marca,
  tipo_id = EXCLUDED.tipo_id,
  estado_id = EXCLUDED.estado_id,
  especificaciones = EXCLUDED.especificaciones,
  proximo_mantenimiento = EXCLUDED.proximo_mantenimiento,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

-- 4) Carga de asignaciones equipo_en_flotas
WITH src AS (
  SELECT *
  FROM jsonb_to_recordset(
    $$[
      {"id":3,"flota_id":4,"equipo_id":1,"instalado_el":"2026-03-13 00:00:00","retirado_el":null},
      {"id":14,"flota_id":1,"equipo_id":2,"instalado_el":"2026-03-17 00:00:00","retirado_el":null}
    ]$$::jsonb
  ) AS t(
    id int,
    flota_id int,
    equipo_id int,
    instalado_el text,
    retirado_el text
  )
)
INSERT INTO equipo_en_flotas (
  id, flota_id, equipo_id, instalado_el, retirado_el
)
SELECT
  s.id,
  s.flota_id,
  s.equipo_id,
  s.instalado_el::timestamp,
  NULLIF(s.retirado_el, '')::timestamp
FROM src s
ON CONFLICT (id) DO UPDATE SET
  flota_id = EXCLUDED.flota_id,
  equipo_id = EXCLUDED.equipo_id,
  instalado_el = EXCLUDED.instalado_el,
  retirado_el = EXCLUDED.retirado_el;

-- 5) Ajustar secuencias para próximos inserts automáticos
SELECT setval(pg_get_serial_sequence('flotas','id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM flotas), 1), true);
SELECT setval(pg_get_serial_sequence('equipos','id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM equipos), 1), true);
SELECT setval(pg_get_serial_sequence('equipo_en_flotas','id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM equipo_en_flotas), 1), true);

COMMIT;