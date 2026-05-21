//! Núcleo financiero — dominio puro de la aplicación.
//!
//! Este crate no depende de Tauri, SQLite ni React: contiene únicamente
//! las reglas de negocio y los motores de cálculo. Es el centro de la
//! arquitectura hexagonal.

mod dinero;
mod interes;
mod movimiento;
mod proyeccion;
mod saldo;

pub use dinero::Decimal;
pub use interes::{
    ganancia_diaria, proyeccion_fin_de_mes, serie_acreditacion, Acreditacion, TramoTasa,
};
pub use movimiento::{Movimiento, TipoMovimiento};
pub use proyeccion::{
    proyectar, CuentaRemunerada, EstadoInicial, FlujoRecurrente, Frecuencia, PuntoProyeccion,
    Supuestos,
};
pub use saldo::saldo_de_cuenta;
