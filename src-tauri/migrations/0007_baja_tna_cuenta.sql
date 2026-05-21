-- Migración 0007 · Baja del campo tna de cuenta.
-- El modelo de TNA pasó a tramos históricos en tasa_tna (migración 0006).
-- Este campo monovalor venía de la Fase 1 y quedó sin uso.

ALTER TABLE cuenta DROP COLUMN tna;
