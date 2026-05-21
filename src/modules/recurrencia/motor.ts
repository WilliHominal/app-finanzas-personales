/**
 * Motor de recurrencia: lógica pura para calcular cuándo una regla debe
 * generar un movimiento. Sin acceso a base de datos ni a Tauri.
 */

/**
 * Calcula las fechas de ocurrencia mensual de una regla, desde el inicio de
 * su vigencia hasta hoy (o hasta el fin de vigencia, lo que ocurra antes).
 * Las fechas se manejan como texto `YYYY-MM-DD`, comparable cronológicamente.
 */
export function ocurrenciasHasta(
  vigenciaDesde: string,
  vigenciaHasta: string | null,
  diaAplicacion: number,
  hoy: string,
): string[] {
  const limite =
    vigenciaHasta !== null && vigenciaHasta < hoy ? vigenciaHasta : hoy;

  const ocurrencias: string[] = [];
  let anio = Number(vigenciaDesde.slice(0, 4));
  let mes = Number(vigenciaDesde.slice(5, 7));
  const dia = String(diaAplicacion).padStart(2, "0");
  const anioTope = Number(limite.slice(0, 4)) + 1;

  while (anio <= anioTope) {
    const fecha = `${anio}-${String(mes).padStart(2, "0")}-${dia}`;
    if (fecha > limite) break;
    if (fecha >= vigenciaDesde) ocurrencias.push(fecha);
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }

  return ocurrencias;
}
