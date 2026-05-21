-- Migración 0004 · Reglas recurrentes (ingresos y gastos programados).

CREATE TABLE regla_recurrente (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo           TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Gasto')),
    descripcion    TEXT NOT NULL,
    monto          TEXT NOT NULL,
    cuenta_id      INTEGER NOT NULL REFERENCES cuenta(id),
    categoria_id   INTEGER REFERENCES categoria(id),
    frecuencia     TEXT NOT NULL DEFAULT 'Mensual'
                       CHECK (frecuencia IN ('Mensual', 'Quincenal', 'Semanal', 'Anual')),
    dia_aplicacion INTEGER NOT NULL,
    vigencia_desde TEXT NOT NULL,
    vigencia_hasta TEXT,
    modo           TEXT NOT NULL DEFAULT 'Confirmar'
                       CHECK (modo IN ('Confirmar', 'Automatico')),
    activa         INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_regla_cuenta ON regla_recurrente(cuenta_id);
