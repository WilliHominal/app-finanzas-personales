import { useState } from "react";
import { PantallaCuentas } from "../modules/cuentas/PantallaCuentas";
import { PantallaDashboard } from "../modules/dashboard/PantallaDashboard";
import { PantallaMovimientos } from "../modules/movimientos/PantallaMovimientos";
import { PantallaCategorias } from "../modules/parametros/PantallaCategorias";
import { PantallaCotizaciones } from "../modules/parametros/PantallaCotizaciones";
import "./App.css";

type Vista =
  | "dashboard"
  | "movimientos"
  | "cuentas"
  | "categorias"
  | "cotizaciones";

const NAVEGACION: { id: Vista; etiqueta: string }[] = [
  { id: "dashboard", etiqueta: "Dashboard" },
  { id: "movimientos", etiqueta: "Movimientos" },
  { id: "cuentas", etiqueta: "Cuentas" },
  { id: "categorias", etiqueta: "Categorías" },
  { id: "cotizaciones", etiqueta: "Cotizaciones" },
];

function App() {
  const [vista, setVista] = useState<Vista>("dashboard");

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
        {vista === "dashboard" && <PantallaDashboard />}
        {vista === "movimientos" && <PantallaMovimientos />}
        {vista === "cuentas" && <PantallaCuentas />}
        {vista === "categorias" && <PantallaCategorias />}
        {vista === "cotizaciones" && <PantallaCotizaciones />}
      </main>
    </div>
  );
}

export default App;
