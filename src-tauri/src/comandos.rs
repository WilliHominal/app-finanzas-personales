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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CuentaEntrada {
    id: i64,
    moneda: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cotizaciones {
    financiero: String,
    cripto: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SaldoCuenta {
    cuenta_id: i64,
    saldo: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResumenPatrimonial {
    saldos: Vec<SaldoCuenta>,
    total_pesos: String,
    total_dolares: String,
    consolidado_pesos: String,
    consolidado_dolares: String,
}

fn a_decimal(valor: &Option<String>) -> Option<Decimal> {
    valor
        .as_ref()
        .and_then(|texto| Decimal::from_str(texto).ok())
}

fn decimal_o_cero(texto: &str) -> Decimal {
    Decimal::from_str(texto).unwrap_or(Decimal::ZERO)
}

fn tipo_desde(texto: &str) -> TipoMovimiento {
    match texto {
        "Apertura" => TipoMovimiento::Apertura,
        "Ingreso" => TipoMovimiento::Ingreso,
        "Gasto" => TipoMovimiento::Gasto,
        _ => TipoMovimiento::Transferencia,
    }
}

/// Calcula el saldo de cada cuenta, los totales por moneda y el patrimonio
/// consolidado. Cada moneda se valúa con su cotización: USD con el dólar
/// financiero, USDT y USDC con el dólar cripto. Todo con decimal exacto.
#[tauri::command]
pub fn resumen_patrimonial(
    cuentas: Vec<CuentaEntrada>,
    movimientos: Vec<MovimientoEntrada>,
    cotizaciones: Cotizaciones,
) -> ResumenPatrimonial {
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

    let financiero = decimal_o_cero(&cotizaciones.financiero);
    let cripto = decimal_o_cero(&cotizaciones.cripto);

    let mut saldos = Vec::new();
    let mut total_ars = Decimal::ZERO;
    let mut total_usd = Decimal::ZERO;
    let mut total_cripto = Decimal::ZERO;

    for cuenta in cuentas {
        let saldo = saldo_de_cuenta(cuenta.id, &dominio);
        saldos.push(SaldoCuenta {
            cuenta_id: cuenta.id,
            saldo: saldo.to_string(),
        });
        match cuenta.moneda.as_str() {
            "ARS" => total_ars += saldo,
            "USD" => total_usd += saldo,
            _ => total_cripto += saldo,
        }
    }

    let total_dolares = total_usd + total_cripto;
    let consolidado_pesos = total_ars + total_usd * financiero + total_cripto * cripto;
    let consolidado_dolares = total_usd
        + total_cripto
        + if financiero > Decimal::ZERO {
            total_ars / financiero
        } else {
            Decimal::ZERO
        };

    ResumenPatrimonial {
        saldos,
        total_pesos: total_ars.to_string(),
        total_dolares: total_dolares.to_string(),
        consolidado_pesos: consolidado_pesos.round_dp(2).to_string(),
        consolidado_dolares: consolidado_dolares.round_dp(2).to_string(),
    }
}
