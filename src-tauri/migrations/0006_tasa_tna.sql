-- Migración 0006 · Tramos históricos de TNA y puntero de acreditación de interés.

CREATE TABLE tasa_tna (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    cuenta_id      INTEGER NOT NULL REFERENCES cuenta(id),
    vigencia_desde TEXT NOT NULL,
    tna            TEXT NOT NULL
);

CREATE INDEX idx_tasa_tna_cuenta ON tasa_tna(cuenta_id);

ALTER TABLE cuenta ADD COLUMN interes_acreditado_hasta TEXT;
