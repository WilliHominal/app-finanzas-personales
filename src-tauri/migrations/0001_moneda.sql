-- Migración 0001 · Catálogo de monedas y semilla inicial.

CREATE TABLE moneda (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo  TEXT NOT NULL UNIQUE,
    simbolo TEXT NOT NULL
);

INSERT INTO moneda (codigo, simbolo) VALUES
    ('ARS',  '$'),
    ('USD',  'US$'),
    ('USDT', 'USDT'),
    ('USDC', 'USDC');
