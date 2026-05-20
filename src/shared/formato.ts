const formateador = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea un monto decimal (texto) al formato es-AR: 1.234,56. */
export function formatearMonto(valor: string | null): string {
  if (valor === null || valor === "") return "—";
  const numero = Number(valor);
  return Number.isFinite(numero) ? formateador.format(numero) : valor;
}
