-- Migración 0003 · Cotizaciones de referencia (dólar financiero y cripto).

CREATE TABLE cotizacion (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre              TEXT NOT NULL UNIQUE,
    valor               TEXT NOT NULL DEFAULT '0',
    fecha_actualizacion TEXT
);

INSERT INTO cotizacion (nombre) VALUES
    ('Dólar Financiero'),
    ('Dólar Cripto');
