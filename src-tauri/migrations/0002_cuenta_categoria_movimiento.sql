-- Migración 0002 · Cuentas, categorías y movimientos (MVP libro de cuentas).

CREATE TABLE categoria (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo   TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Gasto')),
    color  TEXT,
    activa INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE cuenta (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre                 TEXT NOT NULL,
    tipo                   TEXT NOT NULL CHECK (tipo IN (
                               'Efectivo', 'BancoCorriente', 'Remunerada',
                               'CriptoLiquido', 'CriptoInversion', 'InversionesLargoPlazo',
                               'PrestamoOtorgado', 'PrestamoRecibido')),
    moneda_id              INTEGER NOT NULL REFERENCES moneda(id),
    estado                 TEXT NOT NULL DEFAULT 'Activa' CHECK (estado IN ('Activa', 'Archivada')),
    tna                    TEXT,
    retorno_anual_estimado TEXT,
    rendimiento_dividendos TEXT
);

CREATE TABLE movimiento (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha             TEXT NOT NULL,
    descripcion       TEXT NOT NULL DEFAULT '',
    tipo              TEXT NOT NULL CHECK (tipo IN ('Apertura', 'Ingreso', 'Gasto', 'Transferencia')),
    cuenta_origen_id  INTEGER REFERENCES cuenta(id),
    cuenta_destino_id INTEGER REFERENCES cuenta(id),
    monto_origen      TEXT,
    monto_destino     TEXT,
    categoria_id      INTEGER REFERENCES categoria(id)
);

CREATE INDEX idx_movimiento_cuenta_origen  ON movimiento(cuenta_origen_id);
CREATE INDEX idx_movimiento_cuenta_destino ON movimiento(cuenta_destino_id);
CREATE INDEX idx_movimiento_fecha          ON movimiento(fecha);
