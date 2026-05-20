//! Cálculo del saldo de una cuenta.
//!
//! Principio rector: el saldo de una cuenta es SIEMPRE la suma de sus
//! movimientos. No existe un saldo almacenado aparte que pueda
//! desincronizarse.

use crate::dinero::Decimal;
use crate::movimiento::Movimiento;

/// Calcula el saldo de una cuenta sumando el efecto de cada movimiento.
pub fn saldo_de_cuenta(cuenta_id: i64, movimientos: &[Movimiento]) -> Decimal {
    movimientos
        .iter()
        .map(|m| m.efecto_sobre(cuenta_id))
        .sum()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::movimiento::TipoMovimiento;
    use std::str::FromStr;

    fn dec(s: &str) -> Decimal {
        Decimal::from_str(s).unwrap()
    }

    fn apertura(cuenta_id: i64, monto: &str) -> Movimiento {
        Movimiento {
            tipo: TipoMovimiento::Apertura,
            cuenta_origen_id: None,
            cuenta_destino_id: Some(cuenta_id),
            monto_origen: None,
            monto_destino: Some(dec(monto)),
        }
    }

    fn ingreso(cuenta_id: i64, monto: &str) -> Movimiento {
        Movimiento {
            tipo: TipoMovimiento::Ingreso,
            cuenta_origen_id: None,
            cuenta_destino_id: Some(cuenta_id),
            monto_origen: None,
            monto_destino: Some(dec(monto)),
        }
    }

    fn gasto(cuenta_id: i64, monto: &str) -> Movimiento {
        Movimiento {
            tipo: TipoMovimiento::Gasto,
            cuenta_origen_id: Some(cuenta_id),
            cuenta_destino_id: None,
            monto_origen: Some(dec(monto)),
            monto_destino: None,
        }
    }

    fn transferencia(origen: i64, destino: i64, monto_origen: &str, monto_destino: &str) -> Movimiento {
        Movimiento {
            tipo: TipoMovimiento::Transferencia,
            cuenta_origen_id: Some(origen),
            cuenta_destino_id: Some(destino),
            monto_origen: Some(dec(monto_origen)),
            monto_destino: Some(dec(monto_destino)),
        }
    }

    #[test]
    fn una_cuenta_sin_movimientos_tiene_saldo_cero() {
        assert_eq!(saldo_de_cuenta(1, &[]), Decimal::ZERO);
    }

    #[test]
    fn la_apertura_define_el_saldo_inicial() {
        let movs = [apertura(1, "1000.00")];

        assert_eq!(saldo_de_cuenta(1, &movs), dec("1000.00"));
    }

    #[test]
    fn el_ingreso_suma_y_el_gasto_resta() {
        let movs = [apertura(1, "1000.00"), ingreso(1, "500.00"), gasto(1, "300.00")];

        assert_eq!(saldo_de_cuenta(1, &movs), dec("1200.00"));
    }

    #[test]
    fn el_saldo_ignora_los_movimientos_de_otras_cuentas() {
        let movs = [apertura(1, "1000.00"), apertura(2, "9999.00"), gasto(2, "50.00")];

        assert_eq!(saldo_de_cuenta(1, &movs), dec("1000.00"));
    }

    #[test]
    fn una_transferencia_resta_al_origen_y_suma_al_destino() {
        let movs = [apertura(1, "1000.00"), transferencia(1, 2, "400.00", "400.00")];

        assert_eq!(saldo_de_cuenta(1, &movs), dec("600.00"));
        assert_eq!(saldo_de_cuenta(2, &movs), dec("400.00"));
    }

    #[test]
    fn el_saldo_acumula_decimales_de_forma_exacta() {
        let movs = [ingreso(1, "0.10"), ingreso(1, "0.20")];

        assert_eq!(saldo_de_cuenta(1, &movs), dec("0.30"));
    }
}
