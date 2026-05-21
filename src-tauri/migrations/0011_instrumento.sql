-- Migración 0011 · Instrumentos bursátiles (CEDEARs y ETFs) como unidades.
-- Un instrumento es una "unidad de cuenta" más, igual que una moneda: una
-- cuenta tiene N unidades de él y vale su precio de mercado en pesos. Las
-- monedas existentes quedan con tipo 'Moneda'; los instrumentos guardan
-- además su último precio conocido.

ALTER TABLE moneda ADD COLUMN tipo TEXT NOT NULL DEFAULT 'Moneda';
ALTER TABLE moneda ADD COLUMN precio TEXT;
ALTER TABLE moneda ADD COLUMN precio_actualizado TEXT;
