interface Props {
  valor: string;
  onCambio: (color: string) => void;
}

const PALETA = [
  { hex: "#88a892", nombre: "Verde" },
  { hex: "#8aa3c2", nombre: "Azul" },
  { hex: "#a294be", nombre: "Lavanda" },
  { hex: "#c596a0", nombre: "Rosa" },
  { hex: "#c89684", nombre: "Terracota" },
  { hex: "#c3ab7e", nombre: "Arena" },
];

/** Paleta de colores pastel para categorías, con una opción personalizada. */
export function SelectorColor({ valor, onCambio }: Props) {
  const esColorDePaleta = PALETA.some((color) => color.hex === valor);

  return (
    <div className="selector-color">
      {PALETA.map((color) => (
        <button
          key={color.hex}
          type="button"
          className={
            valor === color.hex ? "muestra-color activa" : "muestra-color"
          }
          style={{ background: color.hex }}
          onClick={() => onCambio(color.hex)}
          title={color.nombre}
          aria-label={color.nombre}
          aria-pressed={valor === color.hex}
        />
      ))}
      <label
        className={
          esColorDePaleta
            ? "muestra-color personalizado"
            : "muestra-color personalizado activa"
        }
        title="Color personalizado"
        style={esColorDePaleta ? undefined : { background: valor }}
      >
        <input
          type="color"
          value={valor}
          onChange={(evento) => onCambio(evento.target.value)}
        />
      </label>
    </div>
  );
}
