import { useEffect, useState } from "react";
import { PantallaCuentas } from "../modules/cuentas/PantallaCuentas";
import { PantallaDashboard } from "../modules/dashboard/PantallaDashboard";
import { PantallaMovimientos } from "../modules/movimientos/PantallaMovimientos";
import { PantallaCategorias } from "../modules/parametros/PantallaCategorias";
import { PantallaCotizaciones } from "../modules/parametros/PantallaCotizaciones";
import { PantallaRecurrencia } from "../modules/recurrencia/PantallaRecurrencia";
import { aplicarReglasAutomaticas } from "../modules/recurrencia/recurrencia.servicio";
import "./App.css";

type Vista =
  | "dashboard"
  | "movimientos"
  | "cuentas"
  | "categorias"
  | "cotizaciones"
  | "recurrencia";

const NAVEGACION: { id: Vista; etiqueta: string }[] = [
  { id: "dashboard", etiqueta: "Dashboard" },
  { id: "movimientos", etiqueta: "Movimientos" },
  { id: "recurrencia", etiqueta: "Recurrentes" },
  { id: "cuentas", etiqueta: "Cuentas" },
  { id: "categorias", etiqueta: "Categorías" },
  { id: "cotizaciones", etiqueta: "Cotizaciones" },
];

function App() {
  const [vista, setVista] = useState<Vista>("dashboard");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    aplicarReglasAutomaticas().finally(() => setListo(true));
  }, []);

  if (!listo) {
    return <div className="cargando-app">Cargando…</div>;
  }

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
        {vista === "recurrencia" && <PantallaRecurrencia />}
        {vista === "cuentas" && <PantallaCuentas />}
        {vista === "categorias" && <PantallaCategorias />}
        {vista === "cotizaciones" && <PantallaCotizaciones />}
      </main>
    </div>
  );
}

export default App;
