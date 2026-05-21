-- Migración 0009 · Mes de aplicación para las reglas recurrentes anuales.
-- La columna frecuencia ya existe desde la migración 0004; solo falta el
-- mes, que únicamente usan las reglas con frecuencia 'Anual'.

ALTER TABLE regla_recurrente ADD COLUMN mes_aplicacion INTEGER;
