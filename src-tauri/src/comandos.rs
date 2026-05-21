//! Comandos expuestos al frontend. Son la capa de aplicación: traducen la
//! petición, delegan el cálculo en el núcleo y devuelven el resultado.

use nucleo::{
    ganancia_diaria, proyeccion_fin_de_mes, saldo_de_cuenta, serie_acreditacion, Decimal,
    Movimiento, TipoMovimiento, TramoTasa,
};
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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TramoEntrada {
    vigencia_desde: String,
    tna: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CuentaRemuneradaEntrada {
    cuenta_id: i64,
    saldo: String,
    decimales: u32,
    interes_acreditado_hasta: Option<String>,
    tramos: Vec<TramoEntrada>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AcreditacionSalida {
    fecha: String,
    monto: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RendimientoCuenta {
    cuenta_id: i64,
    acreditaciones: Vec<AcreditacionSalida>,
    ganancia_diaria: String,
    saldo_proyectado_fin_mes: String,
    interes_proyectado_fin_mes: String,
}

/// Calcula, para cada cuenta remunerada, los movimientos de interés que
/// faltan acreditar desde su última fecha computada y la proyección de su
/// saldo al fin del mes. Delega todo el cálculo en el núcleo.
#[tauri::command]
pub fn calcular_rendimientos(
    cuentas: Vec<CuentaRemuneradaEntrada>,
    hoy: String,
) -> Vec<RendimientoCuenta> {
    cuentas
        .into_iter()
        .map(|cuenta| {
            let saldo = decimal_o_cero(&cuenta.saldo);
            let cien = Decimal::from(100);
            let tramos: Vec<TramoTasa> = cuenta
                .tramos
                .iter()
                .map(|tramo| TramoTasa {
                    vigencia_desde: tramo.vigencia_desde.clone(),
                    tna: decimal_o_cero(&tramo.tna) / cien,
                })
                .collect();

            let acreditaciones = match &cuenta.interes_acreditado_hasta {
                Some(desde) => serie_acreditacion(saldo, &tramos, desde, &hoy, cuenta.decimales)
                    .into_iter()
                    .map(|acreditacion| AcreditacionSalida {
                        fecha: acreditacion.fecha,
                        monto: acreditacion.monto.to_string(),
                    })
                    .collect(),
                None => Vec::new(),
            };

            let saldo_proyectado = proyeccion_fin_de_mes(saldo, &tramos, &hoy);
            let interes_proyectado = saldo_proyectado - saldo;
            let ganancia = ganancia_diaria(saldo, &tramos, &hoy);

            RendimientoCuenta {
                cuenta_id: cuenta.cuenta_id,
                acreditaciones,
                ganancia_diaria: ganancia.round_dp(2).to_string(),
                saldo_proyectado_fin_mes: saldo_proyectado.round_dp(2).to_string(),
                interes_proyectado_fin_mes: interes_proyectado.round_dp(2).to_string(),
            }
        })
        .collect()
}
