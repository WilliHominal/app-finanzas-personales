//! Motor de interés compuesto.
//!
//! Calcula el interés que devenga una cuenta remunerada y proyecta su
//! rendimiento. El interés compuesto no se resuelve con una fórmula
//! encadenada: emerge de la propia serie, porque el monto de cada día se
//! calcula sobre el saldo acumulado del día anterior.

use crate::dinero::Decimal;
use rust_decimal::MathematicalOps;

/// Días que el año comercial usa para prorratear una tasa anual.
const DIAS_ANIO: i64 = 365;

/// Un tramo de tasa: la TNA rige desde `vigencia_desde` hasta que empieza
/// el tramo siguiente. La TNA se expresa como fracción anual (`0.27` = 27 %).
#[derive(Debug, Clone)]
pub struct TramoTasa {
    pub vigencia_desde: String,
    pub tna: Decimal,
}

/// El interés generado en una fecha concreta, listo para volverse un
/// movimiento real del libro mayor.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Acreditacion {
    pub fecha: String,
    pub monto: Decimal,
}

/// Convierte una fecha `YYYY-MM-DD` en un número de día absoluto: días
/// transcurridos desde el 1970-01-01. Algoritmo days-from-civil de Hinnant.
fn a_dia_absoluto(fecha: &str) -> i64 {
    let anio: i64 = fecha[0..4].parse().unwrap();
    let mes: i64 = fecha[5..7].parse().unwrap();
    let dia: i64 = fecha[8..10].parse().unwrap();

    let y = if mes <= 2 { anio - 1 } else { anio };
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400;
    let mp = (mes + 9) % 12;
    let doy = (153 * mp + 2) / 5 + dia - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;

    era * 146097 + doe - 719468
}

/// Inversa de [`a_dia_absoluto`]: reconstruye la fecha `YYYY-MM-DD`.
fn a_fecha(dia: i64) -> String {
    let z = dia + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let anio = if m <= 2 { y + 1 } else { y };

    format!("{anio:04}-{m:02}-{d:02}")
}

/// TNA vigente en un día dado: la del tramo más reciente cuya vigencia ya
/// empezó. Si ningún tramo rige aún, la tasa es cero.
fn tna_en(tramos: &[TramoTasa], dia: i64) -> Decimal {
    tramos
        .iter()
        .filter(|tramo| a_dia_absoluto(&tramo.vigencia_desde) <= dia)
        .max_by_key(|tramo| a_dia_absoluto(&tramo.vigencia_desde))
        .map(|tramo| tramo.tna)
        .unwrap_or(Decimal::ZERO)
}

/// Genera el interés compuesto diario de una cuenta entre dos fechas.
///
/// Devuelve una acreditación por cada día del rango `(desde, hasta]`:
/// `desde` es la última fecha ya acreditada, por eso no se vuelve a generar.
/// Cada día usa la TNA de su tramo histórico, de modo que un cambio de tasa
/// se respeta sin distorsionar el cálculo. Los días sin interés —saldo o
/// tasa en cero— no producen acreditación.
pub fn serie_acreditacion(
    saldo_inicial: Decimal,
    tramos: &[TramoTasa],
    desde: &str,
    hasta: &str,
    decimales: u32,
) -> Vec<Acreditacion> {
    let dia_hasta = a_dia_absoluto(hasta);
    let mut saldo = saldo_inicial;
    let mut acreditaciones = Vec::new();

    let mut dia = a_dia_absoluto(desde) + 1;
    while dia <= dia_hasta {
        let tasa_diaria = tna_en(tramos, dia) / Decimal::from(DIAS_ANIO);
        let monto = (saldo * tasa_diaria).round_dp(decimales);
        if monto > Decimal::ZERO {
            acreditaciones.push(Acreditacion {
                fecha: a_fecha(dia),
                monto,
            });
            saldo += monto;
        }
        dia += 1;
    }

    acreditaciones
}

/// Proyecta el saldo dentro de `dias` días capitalizando el interés
/// compuesto a la TNA indicada. Fórmula: `saldo · (1 + i)^días`.
fn proyeccion_saldo(saldo: Decimal, tna: Decimal, dias: i64) -> Decimal {
    if dias <= 0 {
        return saldo;
    }
    let tasa_diaria = tna / Decimal::from(DIAS_ANIO);
    saldo * (Decimal::ONE + tasa_diaria).powi(dias)
}

/// Días desde `hoy` hasta el último día de su mes.
fn dias_hasta_fin_de_mes(hoy: &str) -> i64 {
    let anio: i64 = hoy[0..4].parse().unwrap();
    let mes: i64 = hoy[5..7].parse().unwrap();
    let (anio_sig, mes_sig) = if mes == 12 { (anio + 1, 1) } else { (anio, mes + 1) };
    let primero_mes_siguiente = format!("{anio_sig:04}-{mes_sig:02}-01");

    a_dia_absoluto(&primero_mes_siguiente) - 1 - a_dia_absoluto(hoy)
}

/// Proyecta el saldo al último día del mes usando la TNA vigente hoy: el
/// futuro no tiene tramos, se proyecta con la tasa actual.
pub fn proyeccion_fin_de_mes(saldo: Decimal, tramos: &[TramoTasa], hoy: &str) -> Decimal {
    let tna = tna_en(tramos, a_dia_absoluto(hoy));
    proyeccion_saldo(saldo, tna, dias_hasta_fin_de_mes(hoy))
}

/// Interés que el saldo genera en un día, a la TNA vigente hoy.
pub fn ganancia_diaria(saldo: Decimal, tramos: &[TramoTasa], hoy: &str) -> Decimal {
    let tna = tna_en(tramos, a_dia_absoluto(hoy));
    saldo * tna / Decimal::from(DIAS_ANIO)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    fn dec(s: &str) -> Decimal {
        Decimal::from_str(s).unwrap()
    }

    fn tramo(vigencia_desde: &str, tna: &str) -> TramoTasa {
        TramoTasa {
            vigencia_desde: vigencia_desde.to_string(),
            tna: dec(tna),
        }
    }

    #[test]
    fn el_dia_absoluto_de_la_epoca_es_cero() {
        assert_eq!(a_dia_absoluto("1970-01-01"), 0);
        assert_eq!(a_fecha(0), "1970-01-01");
    }

    #[test]
    fn la_fecha_y_el_dia_absoluto_son_inversos() {
        for fecha in ["2026-05-21", "2024-02-29", "2000-01-01", "1999-12-31"] {
            assert_eq!(a_fecha(a_dia_absoluto(fecha)), fecha);
        }
    }

    #[test]
    fn los_dias_absolutos_cuentan_los_meses_y_los_bisiestos() {
        assert_eq!(
            a_dia_absoluto("2026-03-01") - a_dia_absoluto("2026-02-28"),
            1,
        );
        assert_eq!(
            a_dia_absoluto("2024-03-01") - a_dia_absoluto("2024-02-29"),
            1,
        );
    }

    #[test]
    fn sin_tramos_la_tasa_es_cero() {
        assert_eq!(tna_en(&[], a_dia_absoluto("2026-05-21")), Decimal::ZERO);
    }

    #[test]
    fn antes_del_primer_tramo_la_tasa_es_cero() {
        let tramos = [tramo("2026-06-01", "0.27")];

        assert_eq!(tna_en(&tramos, a_dia_absoluto("2026-05-21")), Decimal::ZERO);
    }

    #[test]
    fn la_tasa_es_la_del_tramo_mas_reciente_ya_vigente() {
        let tramos = [tramo("2026-01-01", "0.27"), tramo("2026-05-23", "0.40")];

        assert_eq!(tna_en(&tramos, a_dia_absoluto("2026-05-22")), dec("0.27"));
        assert_eq!(tna_en(&tramos, a_dia_absoluto("2026-05-23")), dec("0.40"));
    }

    #[test]
    fn un_rango_vacio_no_genera_acreditaciones() {
        let tramos = [tramo("2026-01-01", "0.27")];
        let serie = serie_acreditacion(dec("100000"), &tramos, "2026-05-20", "2026-05-20", 2);

        assert!(serie.is_empty());
    }

    #[test]
    fn un_saldo_en_cero_no_genera_acreditaciones() {
        let tramos = [tramo("2026-01-01", "0.27")];
        let serie = serie_acreditacion(Decimal::ZERO, &tramos, "2026-05-20", "2026-05-25", 2);

        assert!(serie.is_empty());
    }

    #[test]
    fn cada_dia_genera_su_acreditacion() {
        let tramos = [tramo("2026-01-01", "0.27")];
        let serie = serie_acreditacion(dec("100000"), &tramos, "2026-05-20", "2026-05-22", 2);

        assert_eq!(
            serie,
            vec![
                Acreditacion { fecha: "2026-05-21".to_string(), monto: dec("73.97") },
                Acreditacion { fecha: "2026-05-22".to_string(), monto: dec("74.03") },
            ],
        );
    }

    #[test]
    fn el_interes_compone_dia_a_dia() {
        let tramos = [tramo("2026-01-01", "0.27")];
        let serie = serie_acreditacion(dec("100000"), &tramos, "2026-05-20", "2026-05-22", 2);

        assert!(serie[1].monto > serie[0].monto);
    }

    #[test]
    fn la_serie_respeta_el_cambio_historico_de_tasa() {
        let tramos = [tramo("2026-01-01", "0.27"), tramo("2026-05-23", "0.40")];
        let serie = serie_acreditacion(dec("100000"), &tramos, "2026-05-20", "2026-05-23", 2);

        assert_eq!(serie[2], Acreditacion { fecha: "2026-05-23".to_string(), monto: dec("109.75") });
    }

    #[test]
    fn la_proyeccion_a_cero_dias_es_el_saldo_actual() {
        assert_eq!(proyeccion_saldo(dec("100000"), dec("0.27"), 0), dec("100000"));
    }

    #[test]
    fn la_proyeccion_capitaliza_el_interes_compuesto() {
        let proyectado = proyeccion_saldo(dec("100000"), dec("0.27"), 1);

        assert_eq!(proyectado.round_dp(4), dec("100073.9726"));
    }

    #[test]
    fn la_proyeccion_crece_con_una_tasa_positiva() {
        let proyectado = proyeccion_saldo(dec("100000"), dec("0.27"), 30);

        assert!(proyectado > dec("100000"));
    }

    #[test]
    fn los_dias_restantes_del_mes_son_dinamicos() {
        assert_eq!(dias_hasta_fin_de_mes("2026-05-21"), 10);
        assert_eq!(dias_hasta_fin_de_mes("2026-05-31"), 0);
        assert_eq!(dias_hasta_fin_de_mes("2026-12-15"), 16);
    }

    #[test]
    fn los_dias_restantes_cuentan_el_bisiesto() {
        assert_eq!(dias_hasta_fin_de_mes("2026-02-15"), 13);
        assert_eq!(dias_hasta_fin_de_mes("2024-02-15"), 14);
    }

    #[test]
    fn la_proyeccion_de_fin_de_mes_usa_la_tasa_vigente() {
        let tramos = [tramo("2026-01-01", "0.27")];
        let proyectado = proyeccion_fin_de_mes(dec("100000"), &tramos, "2026-05-21");

        assert!(proyectado > dec("100000"));
    }

    #[test]
    fn sin_tasa_vigente_la_proyeccion_es_el_saldo_actual() {
        let proyectado = proyeccion_fin_de_mes(dec("100000"), &[], "2026-05-21");

        assert_eq!(proyectado, dec("100000"));
    }

    #[test]
    fn la_ganancia_diaria_aplica_la_tasa_vigente() {
        let tramos = [tramo("2026-01-01", "0.27")];
        let ganancia = ganancia_diaria(dec("100000"), &tramos, "2026-05-21");

        assert_eq!(ganancia.round_dp(4), dec("73.9726"));
    }

    #[test]
    fn sin_tasa_vigente_no_hay_ganancia_diaria() {
        assert_eq!(
            ganancia_diaria(dec("100000"), &[], "2026-05-21"),
            Decimal::ZERO,
        );
    }
}
