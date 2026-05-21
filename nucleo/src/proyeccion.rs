//! Motor de proyección patrimonial.
//!
//! Responde "¿cuánto patrimonio voy a tener en N meses?". Es la tercera
//! pata de "Hechos ≠ Reglas ≠ Proyecciones": una proyección se CALCULA a
//! partir del estado de hoy más las reglas más los supuestos, y nunca se
//! guarda. Este motor lee datos y no persiste nada.

use crate::dinero::Decimal;
use rust_decimal::MathematicalOps;

/// Meses del año, para prorratear tasas anuales.
const MESES_ANIO: i64 = 12;

/// Cada cuánto se repite una regla recurrente.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Frecuencia {
    Mensual,
    Anual,
}

/// El patrimonio de hoy, repartido según cómo evoluciona cada parte.
#[derive(Debug, Clone)]
pub struct EstadoInicial {
    /// Pesos que no rinden: efectivo, cuenta corriente y préstamos
    /// congelados. Solo se mueve con los flujos de las reglas.
    pub pesos: Decimal,
    /// Tenencia en dólares (divisa y stablecoins). Su valor en pesos sigue
    /// al dólar, que se proyecta acompañando la inflación.
    pub dolares: Decimal,
    /// Valor de las cuentas de inversión. Crece a la tasa estimada.
    pub inversiones: Decimal,
}

/// Una cuenta remunerada: capitaliza interés compuesto a su TNA.
#[derive(Debug, Clone)]
pub struct CuentaRemunerada {
    pub saldo: Decimal,
    /// TNA como fracción anual (`0.27` = 27 %).
    pub tna: Decimal,
}

/// Una regla recurrente vista por el proyector: un flujo futuro conocido.
#[derive(Debug, Clone)]
pub struct FlujoRecurrente {
    /// Monto del flujo, siempre positivo.
    pub monto: Decimal,
    pub es_ingreso: bool,
    /// Si el monto está expresado en dólares en lugar de pesos.
    pub en_dolares: bool,
    pub frecuencia: Frecuencia,
    /// Mes del año (1-12) en que cae una regla anual; se ignora si es mensual.
    pub mes_aplicacion: Option<u32>,
    pub vigencia_desde: String,
    pub vigencia_hasta: Option<String>,
}

/// Supuestos del usuario: lo que no se sabe y hay que estimar.
#[derive(Debug, Clone)]
pub struct Supuestos {
    /// Inflación anual estimada, como fracción.
    pub inflacion_anual: Decimal,
    /// Crecimiento anual estimado de las inversiones, como fracción.
    pub rendimiento_inversiones_anual: Decimal,
    /// Pesos por dólar al día de hoy.
    pub dolar_inicial: Decimal,
}

/// Un mes de la proyección: el patrimonio en pesos nominales y su valor
/// equivalente en dólares, al dólar proyectado de ese mes.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PuntoProyeccion {
    pub mes: u32,
    pub patrimonio_nominal: Decimal,
    pub patrimonio_usd: Decimal,
}

/// Año y mes calendario a `desplazamiento` meses de `hoy`.
fn mes_desplazado(hoy: &str, desplazamiento: u32) -> (i64, u32) {
    let anio: i64 = hoy[0..4].parse().unwrap();
    let mes: u32 = hoy[5..7].parse().unwrap();
    let total = mes - 1 + desplazamiento;
    (anio + (total / 12) as i64, total % 12 + 1)
}

/// Indica si una regla genera un flujo en el mes calendario dado.
fn ocurre_en(flujo: &FlujoRecurrente, anio: i64, mes: u32) -> bool {
    let etiqueta = format!("{anio:04}-{mes:02}");
    if flujo.vigencia_desde[..7] > etiqueta[..] {
        return false;
    }
    if let Some(hasta) = &flujo.vigencia_hasta {
        if hasta[..7] < etiqueta[..] {
            return false;
        }
    }
    match flujo.frecuencia {
        Frecuencia::Mensual => true,
        Frecuencia::Anual => flujo.mes_aplicacion == Some(mes),
    }
}

/// Factor de crecimiento mensual equivalente a una tasa anual: la raíz
/// duodécima de `(1 + tasa)`. Una tasa en cero deja el factor en uno.
fn factor_mensual(tasa_anual: Decimal) -> Decimal {
    if tasa_anual.is_zero() {
        return Decimal::ONE;
    }
    (Decimal::ONE + tasa_anual).powd(Decimal::ONE / Decimal::from(MESES_ANIO))
}

/// Proyecta el patrimonio mes a mes, desde hoy hasta `horizonte_meses`.
///
/// Devuelve un punto por mes —el índice 0 es hoy—. Cada mes capitaliza las
/// cuentas remuneradas y las inversiones, suma los flujos de las reglas que
/// caen ese mes y revalúa los dólares al dólar proyectado. Los préstamos
/// van congelados dentro de `pesos`. El valor en dólares divide el
/// patrimonio nominal por el dólar proyectado de cada mes.
pub fn proyectar(
    estado: EstadoInicial,
    remuneradas: &[CuentaRemunerada],
    flujos: &[FlujoRecurrente],
    supuestos: Supuestos,
    horizonte_meses: u32,
    hoy: &str,
) -> Vec<PuntoProyeccion> {
    let factor_inflacion = factor_mensual(supuestos.inflacion_anual);
    let factor_inversiones = factor_mensual(supuestos.rendimiento_inversiones_anual);

    let mut pesos = estado.pesos;
    let mut dolares = estado.dolares;
    let mut inversiones = estado.inversiones;
    let mut saldos_remuneradas: Vec<Decimal> =
        remuneradas.iter().map(|cuenta| cuenta.saldo).collect();

    let mut serie = Vec::with_capacity(horizonte_meses as usize + 1);

    for mes in 0..=horizonte_meses {
        if mes > 0 {
            for (saldo, cuenta) in saldos_remuneradas.iter_mut().zip(remuneradas.iter()) {
                *saldo *= Decimal::ONE + cuenta.tna / Decimal::from(MESES_ANIO);
            }
            inversiones *= factor_inversiones;

            let (anio, mes_calendario) = mes_desplazado(hoy, mes);
            for flujo in flujos {
                if !ocurre_en(flujo, anio, mes_calendario) {
                    continue;
                }
                let monto = if flujo.es_ingreso {
                    flujo.monto
                } else {
                    -flujo.monto
                };
                if flujo.en_dolares {
                    dolares += monto;
                } else {
                    pesos += monto;
                }
            }
        }

        let acumulado_inflacion = factor_inflacion.powi(mes as i64);
        let dolar = supuestos.dolar_inicial * acumulado_inflacion;
        let remunerada_total: Decimal = saldos_remuneradas.iter().sum();
        let nominal = pesos + remunerada_total + dolares * dolar + inversiones;
        let en_usd = if dolar.is_zero() {
            Decimal::ZERO
        } else {
            nominal / dolar
        };

        serie.push(PuntoProyeccion {
            mes,
            patrimonio_nominal: nominal.round_dp(2),
            patrimonio_usd: en_usd.round_dp(2),
        });
    }

    serie
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    fn dec(s: &str) -> Decimal {
        Decimal::from_str(s).unwrap()
    }

    fn estado(pesos: &str, dolares: &str, inversiones: &str) -> EstadoInicial {
        EstadoInicial {
            pesos: dec(pesos),
            dolares: dec(dolares),
            inversiones: dec(inversiones),
        }
    }

    fn supuestos(inflacion: &str, rendimiento: &str) -> Supuestos {
        Supuestos {
            inflacion_anual: dec(inflacion),
            rendimiento_inversiones_anual: dec(rendimiento),
            dolar_inicial: dec("1000"),
        }
    }

    fn supuestos_neutros() -> Supuestos {
        supuestos("0", "0")
    }

    fn flujo(
        monto: &str,
        es_ingreso: bool,
        en_dolares: bool,
        frecuencia: Frecuencia,
        mes_aplicacion: Option<u32>,
    ) -> FlujoRecurrente {
        FlujoRecurrente {
            monto: dec(monto),
            es_ingreso,
            en_dolares,
            frecuencia,
            mes_aplicacion,
            vigencia_desde: "2020-01-01".to_string(),
            vigencia_hasta: None,
        }
    }

    #[test]
    fn el_mes_desplazado_cruza_el_anio() {
        assert_eq!(mes_desplazado("2026-05-21", 0), (2026, 5));
        assert_eq!(mes_desplazado("2026-05-21", 7), (2026, 12));
        assert_eq!(mes_desplazado("2026-05-21", 8), (2027, 1));
        assert_eq!(mes_desplazado("2026-12-01", 1), (2027, 1));
    }

    #[test]
    fn la_serie_tiene_un_punto_por_mes_mas_el_de_hoy() {
        let serie = proyectar(
            estado("1000", "0", "0"),
            &[],
            &[],
            supuestos_neutros(),
            6,
            "2026-05-21",
        );

        assert_eq!(serie.len(), 7);
        assert_eq!(serie[0].mes, 0);
        assert_eq!(serie[6].mes, 6);
    }

    #[test]
    fn el_mes_cero_es_la_foto_de_hoy() {
        let serie = proyectar(
            estado("1000", "10", "500"),
            &[],
            &[],
            supuestos_neutros(),
            3,
            "2026-05-21",
        );

        assert_eq!(serie[0].patrimonio_nominal, dec("11500"));
        assert_eq!(serie[0].patrimonio_usd, dec("11.5"));
    }

    #[test]
    fn sin_movimiento_ni_inflacion_el_patrimonio_no_cambia() {
        let serie = proyectar(
            estado("1000", "0", "0"),
            &[],
            &[],
            supuestos_neutros(),
            12,
            "2026-05-21",
        );

        assert!(serie.iter().all(|p| p.patrimonio_nominal == dec("1000")));
    }

    #[test]
    fn un_ingreso_mensual_suma_cada_mes() {
        let serie = proyectar(
            estado("0", "0", "0"),
            &[],
            &[flujo("100", true, false, Frecuencia::Mensual, None)],
            supuestos_neutros(),
            3,
            "2026-05-21",
        );

        assert_eq!(serie[0].patrimonio_nominal, dec("0"));
        assert_eq!(serie[1].patrimonio_nominal, dec("100"));
        assert_eq!(serie[2].patrimonio_nominal, dec("200"));
        assert_eq!(serie[3].patrimonio_nominal, dec("300"));
    }

    #[test]
    fn un_gasto_mensual_resta_cada_mes() {
        let serie = proyectar(
            estado("1000", "0", "0"),
            &[],
            &[flujo("50", false, false, Frecuencia::Mensual, None)],
            supuestos_neutros(),
            2,
            "2026-05-21",
        );

        assert_eq!(serie[1].patrimonio_nominal, dec("950"));
        assert_eq!(serie[2].patrimonio_nominal, dec("900"));
    }

    #[test]
    fn una_regla_anual_aporta_solo_en_su_mes() {
        let serie = proyectar(
            estado("0", "0", "0"),
            &[],
            &[flujo("1200", true, false, Frecuencia::Anual, Some(8))],
            supuestos_neutros(),
            12,
            "2026-05-21",
        );

        assert_eq!(serie[2].patrimonio_nominal, dec("0"));
        assert_eq!(serie[3].patrimonio_nominal, dec("1200"));
        assert_eq!(serie[12].patrimonio_nominal, dec("1200"));
    }

    #[test]
    fn la_cuenta_remunerada_capitaliza_mes_a_mes() {
        let serie = proyectar(
            estado("0", "0", "0"),
            &[CuentaRemunerada {
                saldo: dec("100000"),
                tna: dec("0.12"),
            }],
            &[],
            supuestos_neutros(),
            12,
            "2026-05-21",
        );

        assert_eq!(serie[0].patrimonio_nominal, dec("100000"));
        assert_eq!(serie[1].patrimonio_nominal, dec("101000"));
        assert!(serie[12].patrimonio_nominal > dec("112000"));
        assert!(serie[12].patrimonio_nominal < dec("113000"));
    }

    #[test]
    fn el_patrimonio_en_usd_cae_cuando_los_pesos_se_devaluan() {
        let serie = proyectar(
            estado("112000", "0", "0"),
            &[],
            &[],
            supuestos("0.12", "0"),
            12,
            "2026-05-21",
        );

        assert_eq!(serie[12].patrimonio_nominal, dec("112000"));
        assert_eq!(serie[0].patrimonio_usd, dec("112"));
        assert!(serie[12].patrimonio_usd > dec("99"));
        assert!(serie[12].patrimonio_usd < dec("101"));
        assert!(serie[12].patrimonio_usd < serie[0].patrimonio_usd);
    }

    #[test]
    fn los_dolares_se_mantienen_estables_en_la_vista_usd() {
        let serie = proyectar(
            estado("0", "100", "0"),
            &[],
            &[],
            supuestos("0.12", "0"),
            12,
            "2026-05-21",
        );

        assert_eq!(serie[0].patrimonio_nominal, dec("100000"));
        assert!(serie[12].patrimonio_nominal > serie[0].patrimonio_nominal);
        assert!(serie.iter().all(|p| p.patrimonio_usd == dec("100")));
    }

    #[test]
    fn las_inversiones_crecen_a_su_tasa() {
        let serie = proyectar(
            estado("0", "0", "1000"),
            &[],
            &[],
            supuestos("0", "0.12"),
            12,
            "2026-05-21",
        );

        assert_eq!(serie[0].patrimonio_nominal, dec("1000"));
        assert!(serie[12].patrimonio_nominal > dec("1119"));
        assert!(serie[12].patrimonio_nominal < dec("1121"));
    }

    #[test]
    fn una_regla_vencida_no_aporta() {
        let mut regla = flujo("100", true, false, Frecuencia::Mensual, None);
        regla.vigencia_hasta = Some("2026-04-30".to_string());
        let serie = proyectar(
            estado("500", "0", "0"),
            &[],
            &[regla],
            supuestos_neutros(),
            6,
            "2026-05-21",
        );

        assert!(serie.iter().all(|p| p.patrimonio_nominal == dec("500")));
    }

    #[test]
    fn una_regla_que_arranca_en_el_futuro_aporta_desde_su_mes() {
        let mut regla = flujo("100", true, false, Frecuencia::Mensual, None);
        regla.vigencia_desde = "2026-08-01".to_string();
        let serie = proyectar(
            estado("0", "0", "0"),
            &[],
            &[regla],
            supuestos_neutros(),
            6,
            "2026-05-21",
        );

        assert_eq!(serie[2].patrimonio_nominal, dec("0"));
        assert_eq!(serie[3].patrimonio_nominal, dec("100"));
        assert_eq!(serie[4].patrimonio_nominal, dec("200"));
    }

    #[test]
    fn un_flujo_en_dolares_se_valua_al_dolar() {
        let serie = proyectar(
            estado("0", "0", "0"),
            &[],
            &[flujo("10", true, true, Frecuencia::Mensual, None)],
            supuestos_neutros(),
            2,
            "2026-05-21",
        );

        assert_eq!(serie[1].patrimonio_nominal, dec("10000"));
        assert_eq!(serie[2].patrimonio_nominal, dec("20000"));
    }
}
