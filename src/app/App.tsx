import { useState } from "react";
import { PantallaCuentas } from "../modules/cuentas/PantallaCuentas";
import "./App.css";

type Vista = "dashboard" | "movimientos" | "cuentas" | "configuracion";

const NAVEGACION: { id: Vista; etiqueta: string }[] = [
  { id: "dashboard", etiqueta: "Dashboard" },
  { id: "movimientos", etiqueta: "Movimientos" },
  { id: "cuentas", etiqueta: "Cuentas" },
  { id: "configuracion", etiqueta: "Configuración" },
];

function Placeholder({ titulo }: { titulo: string }) {
  return (
    <div className="placeholder">
      <h2>{titulo}</h2>
      <p>Este módulo se construye en una fase próxima.</p>
    </div>
  );
}

function App() {
  const [vista, setVista] = useState<Vista>("cuentas");

  return (
    <div className="app">
      <aside className="barra-lateral">
        <h1 className="marca">Finanzas</h1>
        <nav className="navegacion">
          {NAVEGACION.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === vista ? "nav-item activo" : "nav-item"}
              onClick={() => setVista(item.id)}
            >
              {item.etiqueta}
            </button>
          ))}
        </nav>
      </aside>
      <main className="contenido">
        {vista === "cuentas" && <PantallaCuentas />}
        {vista === "dashboard" && <Placeholder titulo="Dashboard" />}
        {vista === "movimientos" && <Placeholder titulo="Movimientos" />}
        {vista === "configuracion" && <Placeholder titulo="Configuración" />}
      </main>
    </div>
  );
}

export default App;
