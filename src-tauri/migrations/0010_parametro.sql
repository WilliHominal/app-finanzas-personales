-- Migración 0010 · Parámetros configurables de la aplicación.
-- Tabla clave/valor para supuestos que no son hechos contables, como las
-- estimaciones que alimentan el simulador de proyecciones.

CREATE TABLE parametro (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
);

INSERT INTO parametro (clave, valor) VALUES
    ('inflacion_anual', '0'),
    ('rendimiento_inversiones_anual', '0');
