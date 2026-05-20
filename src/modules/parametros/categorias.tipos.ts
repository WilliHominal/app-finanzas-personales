export type TipoCategoria = "Ingreso" | "Gasto";

export interface Categoria {
  id: number;
  nombre: string;
  tipo: TipoCategoria;
  color: string | null;
  activa: boolean;
}

export interface NuevaCategoria {
  nombre: string;
  tipo: TipoCategoria;
  color: string;
}

export const TIPOS_CATEGORIA: TipoCategoria[] = ["Ingreso", "Gasto"];
