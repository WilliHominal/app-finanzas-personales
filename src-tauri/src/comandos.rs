//! Comandos expuestos al frontend. Son la capa de aplicación: traducen la
//! petición, delegan el cálculo en el núcleo y devuelven el resultado.

use nucleo::{saldo_de_cuenta, Decimal, Movimiento, TipoMovimiento};
use serde::{Deserialize, Serialize};
use std::str::FromStr;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MovimientoEntrada {
    tipo: String,
    cuenta_origen_id: Option<i64>,
    cuenta_destino_id: Option<i64>,
    monto_origen: Option<String>,
    monto_destino: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaldoCuenta {
    cuenta_id: i64,
    saldo: String,
}

fn a_decimal(valor: &Option<String>) -> Option<Decimal> {
    valor
        .as_ref()
        .and_then(|texto| Decimal::from_str(texto).ok())
}

fn tipo_desde(texto: &str) -> TipoMovimiento {
    match texto {
        "Apertura" => TipoMovimiento::Apertura,
        "Ingreso" => TipoMovimiento::Ingreso,
        "Gasto" => TipoMovimiento::Gasto,
        _ => TipoMovimiento::Transferencia,
    }
}

/// Calcula el saldo de cada cuenta pedida a partir de la lista completa de
/// movimientos. El cálculo lo resuelve el núcleo financiero.
#[tauri::command]
pub fn calcular_saldos(
    cuentas: Vec<i64>,
    movimientos: Vec<MovimientoEntrada>,
) -> Vec<SaldoCuenta> {
    let dominio: Vec<Movimiento> = movimientos
        .into_iter()
        .map(|entrada| Movimiento {
            tipo: tipo_desde(&entrada.tipo),
            cuenta_origen_id: entrada.cuenta_origen_id,
            cuenta_destino_id: entrada.cuenta_destino_id,
            monto_origen: a_decimal(&entrada.monto_origen),
            monto_destino: a_decimal(&entrada.monto_destino),
        })
        .collect();

    cuentas
        .into_iter()
        .map(|cuenta_id| SaldoCuenta {
            cuenta_id,
            saldo: saldo_de_cuenta(cuenta_id, &dominio).to_string(),
        })
        .collect()
}
