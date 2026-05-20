//! Núcleo financiero — dominio puro de la aplicación.
//!
//! Este crate no depende de Tauri, SQLite ni React: contiene únicamente
//! las reglas de negocio y los motores de cálculo. Es el centro de la
//! arquitectura hexagonal.

mod dinero;
mod movimiento;
mod saldo;

pub use dinero::Decimal;
pub use movimiento::{Movimiento, TipoMovimiento};
pub use saldo::saldo_de_cuenta;
