-- Migración 0008 · Entidad Préstamo.
-- La cuenta de tipo Préstamo Otorgado / Recibido representa el saldo;
-- esta tabla agrega la metadata: contraparte, capital prestado y fecha.

CREATE TABLE prestamo (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    cuenta_id   INTEGER NOT NULL REFERENCES cuenta(id),
    contraparte TEXT NOT NULL,
    capital     TEXT NOT NULL,
    fecha       TEXT NOT NULL,
    notas       TEXT
);

CREATE INDEX idx_prestamo_cuenta ON prestamo(cuenta_id);
