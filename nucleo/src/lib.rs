//! Núcleo financiero — dominio puro de la aplicación.
//!
//! Este crate no depende de Tauri, SQLite ni React: contiene únicamente
//! las reglas de negocio y los motores de cálculo. Es el centro de la
//! arquitectura hexagonal.

pub use rust_decimal::Decimal;

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn el_dinero_se_representa_con_decimal_exacto() {
        let a = Decimal::from_str("0.1").unwrap();
        let b = Decimal::from_str("0.2").unwrap();

        assert_eq!(a + b, Decimal::from_str("0.3").unwrap());
    }
}
