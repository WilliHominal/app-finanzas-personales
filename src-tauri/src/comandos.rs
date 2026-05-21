//! Comandos expuestos al frontend. Son la capa de aplicación: traducen la
//! petición, delegan el cálculo en el núcleo y devuelven el resultado.

use nucleo::{
    ganancia_diaria, proyeccion_fin_de_mes, saldo_de_cuenta, serie_acreditacion, CuentaRemunerada,
    Decimal, EstadoInicial, FlujoRecurrente, Frecuencia, Movimiento, Supuestos, TipoMovimiento,
    TramoTasa,
};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::str::FromStr;
use tauri::{AppHandle, Manager};

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
    /// Precio en pesos por unidad, presente solo en cuentas de instrumentos.
    precio_instrumento: Option<String>,
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
        match &cuenta.precio_instrumento {
            Some(precio) => total_ars += saldo * decimal_o_cero(precio),
            None => match cuenta.moneda.as_str() {
                "ARS" => total_ars += saldo,
                "USD" => total_usd += saldo,
                _ => total_cripto += saldo,
            },
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

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EstadoEntrada {
    pesos: String,
    dolares: String,
    inversiones: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RemuneradaEntrada {
    saldo: String,
    tna: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FlujoEntrada {
    monto: String,
    es_ingreso: bool,
    en_dolares: bool,
    frecuencia: String,
    mes_aplicacion: Option<u32>,
    vigencia_desde: String,
    vigencia_hasta: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SupuestosEntrada {
    inflacion_anual: String,
    rendimiento_inversiones_anual: String,
    dolar_inicial: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PuntoSalida {
    mes: u32,
    patrimonio_nominal: String,
    patrimonio_usd: String,
}

/// Proyecta el patrimonio mes a mes. Arma el estado, las reglas y los
/// supuestos, y delega el cálculo en el motor de proyección del núcleo.
/// Las tasas llegan como porcentaje y se pasan al núcleo como fracción.
#[tauri::command]
pub fn proyectar(
    estado: EstadoEntrada,
    remuneradas: Vec<RemuneradaEntrada>,
    flujos: Vec<FlujoEntrada>,
    supuestos: SupuestosEntrada,
    horizonte: u32,
    hoy: String,
) -> Vec<PuntoSalida> {
    let cien = Decimal::from(100);

    let estado_dominio = EstadoInicial {
        pesos: decimal_o_cero(&estado.pesos),
        dolares: decimal_o_cero(&estado.dolares),
        inversiones: decimal_o_cero(&estado.inversiones),
    };

    let remuneradas_dominio: Vec<CuentaRemunerada> = remuneradas
        .iter()
        .map(|cuenta| CuentaRemunerada {
            saldo: decimal_o_cero(&cuenta.saldo),
            tna: decimal_o_cero(&cuenta.tna) / cien,
        })
        .collect();

    let flujos_dominio: Vec<FlujoRecurrente> = flujos
        .into_iter()
        .map(|flujo| FlujoRecurrente {
            monto: decimal_o_cero(&flujo.monto),
            es_ingreso: flujo.es_ingreso,
            en_dolares: flujo.en_dolares,
            frecuencia: if flujo.frecuencia == "Anual" {
                Frecuencia::Anual
            } else {
                Frecuencia::Mensual
            },
            mes_aplicacion: flujo.mes_aplicacion,
            vigencia_desde: flujo.vigencia_desde,
            vigencia_hasta: flujo.vigencia_hasta,
        })
        .collect();

    let supuestos_dominio = Supuestos {
        inflacion_anual: decimal_o_cero(&supuestos.inflacion_anual) / cien,
        rendimiento_inversiones_anual: decimal_o_cero(&supuestos.rendimiento_inversiones_anual)
            / cien,
        dolar_inicial: decimal_o_cero(&supuestos.dolar_inicial),
    };

    nucleo::proyectar(
        estado_dominio,
        &remuneradas_dominio,
        &flujos_dominio,
        supuestos_dominio,
        horizonte,
        &hoy,
    )
    .into_iter()
    .map(|punto| PuntoSalida {
        mes: punto.mes,
        patrimonio_nominal: punto.patrimonio_nominal.to_string(),
        patrimonio_usd: punto.patrimonio_usd.to_string(),
    })
    .collect()
}

/// Cantidad de respaldos automáticos que se conservan; los más viejos se
/// descartan.
const RESPALDOS_A_CONSERVAR: usize = 14;

/// Ubica el archivo SQLite buscándolo en los directorios donde Tauri lo
/// puede haber dejado.
fn ruta_base_de_datos(app: &AppHandle) -> Result<PathBuf, String> {
    let candidatos = [app.path().app_config_dir(), app.path().app_data_dir()];
    for directorio in candidatos.into_iter().flatten() {
        let archivo = directorio.join("finanzas.db");
        if archivo.exists() {
            return Ok(archivo);
        }
    }
    Err("No se encontró el archivo de base de datos.".to_string())
}

/// Carpeta de respaldos, al lado del archivo de base de datos.
fn carpeta_respaldos(app: &AppHandle) -> Result<PathBuf, String> {
    let base = ruta_base_de_datos(app)?;
    let carpeta = base
        .parent()
        .ok_or("Ruta de base de datos inválida.")?
        .join("backups");
    Ok(carpeta)
}

fn es_archivo_de_respaldo(ruta: &Path) -> bool {
    ruta.file_name()
        .and_then(|nombre| nombre.to_str())
        .map(|nombre| nombre.starts_with("finanzas-") && nombre.ends_with(".db"))
        .unwrap_or(false)
}

/// Conserva los respaldos más recientes y descarta los más viejos.
fn rotar_respaldos(carpeta: &Path) -> Result<(), String> {
    let mut respaldos: Vec<PathBuf> = fs::read_dir(carpeta)
        .map_err(|e| e.to_string())?
        .filter_map(|entrada| entrada.ok().map(|e| e.path()))
        .filter(|ruta| es_archivo_de_respaldo(ruta))
        .collect();
    respaldos.sort();
    while respaldos.len() > RESPALDOS_A_CONSERVAR {
        let _ = fs::remove_file(respaldos.remove(0));
    }
    Ok(())
}

/// Copia la base de datos a la carpeta de respaldos con la fecha del día.
/// Es idempotente: si ya existe el respaldo de hoy no lo duplica. Después
/// rota los respaldos viejos.
#[tauri::command]
pub fn crear_respaldo(app: AppHandle, fecha: String) -> Result<String, String> {
    let origen = ruta_base_de_datos(&app)?;
    let carpeta = carpeta_respaldos(&app)?;
    fs::create_dir_all(&carpeta).map_err(|e| e.to_string())?;

    let destino = carpeta.join(format!("finanzas-{fecha}.db"));
    if !destino.exists() {
        fs::copy(&origen, &destino).map_err(|e| e.to_string())?;
    }
    rotar_respaldos(&carpeta)?;

    Ok(destino.to_string_lossy().into_owned())
}

/// Exporta una copia de la base de datos a la carpeta de descargas.
#[tauri::command]
pub fn exportar_respaldo(app: AppHandle, marca: String) -> Result<String, String> {
    let origen = ruta_base_de_datos(&app)?;
    let descargas = app
        .path()
        .download_dir()
        .map_err(|_| "No se encontró la carpeta de descargas.".to_string())?;
    let destino = descargas.join(format!("finanzas-{marca}.db"));
    fs::copy(&origen, &destino).map_err(|e| e.to_string())?;

    Ok(destino.to_string_lossy().into_owned())
}

/// Lista los nombres de los respaldos, del más reciente al más antiguo.
#[tauri::command]
pub fn listar_respaldos(app: AppHandle) -> Result<Vec<String>, String> {
    let carpeta = carpeta_respaldos(&app)?;
    if !carpeta.exists() {
        return Ok(Vec::new());
    }
    let mut nombres: Vec<String> = fs::read_dir(&carpeta)
        .map_err(|e| e.to_string())?
        .filter_map(|entrada| entrada.ok())
        .filter(|entrada| es_archivo_de_respaldo(&entrada.path()))
        .filter_map(|entrada| entrada.file_name().into_string().ok())
        .collect();
    nombres.sort();
    nombres.reverse();
    Ok(nombres)
}
