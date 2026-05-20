//! Modelo de dominio del movimiento financiero.

use crate::dinero::Decimal;

/// Naturaleza de un movimiento dentro del libro mayor.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TipoMovimiento {
    Apertura,
    Ingreso,
    Gasto,
    Transferencia,
}

/// Un asiento del libro mayor.
///
/// La moneda de cada lado la define la cuenta asociada; un movimiento
/// entre cuentas de distinta moneda es un canje. Ingreso y Apertura usan
/// solo el lado destino; Gasto, solo el origen; Transferencia, ambos.
#[derive(Debug, Clone)]
pub struct Movimiento {
    pub tipo: TipoMovimiento,
    pub cuenta_origen_id: Option<i64>,
    pub cuenta_destino_id: Option<i64>,
    pub monto_origen: Option<Decimal>,
    pub monto_destino: Option<Decimal>,
}

impl Movimiento {
    /// Efecto neto del movimiento sobre el saldo de una cuenta dada:
    /// suma lo que entra a la cuenta y resta lo que sale de ella.
    pub fn efecto_sobre(&self, cuenta_id: i64) -> Decimal {
        let mut efecto = Decimal::ZERO;

        if self.cuenta_destino_id == Some(cuenta_id) {
            efecto += self.monto_destino.unwrap_or(Decimal::ZERO);
        }
        if self.cuenta_origen_id == Some(cuenta_id) {
            efecto -= self.monto_origen.unwrap_or(Decimal::ZERO);
        }

        efecto
    }
}
