//! El dinero del dominio: decimal exacto, sin error de redondeo.

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
