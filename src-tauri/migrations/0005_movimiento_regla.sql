-- Migración 0005 · Vínculo del movimiento con la regla que lo generó.

ALTER TABLE movimiento ADD COLUMN regla_recurrente_id INTEGER;
