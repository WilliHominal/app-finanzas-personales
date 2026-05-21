import { useEffect, useState } from "react";
import { PantallaCuentas } from "../modules/cuentas/PantallaCuentas";
import { PantallaDashboard } from "../modules/dashboard/PantallaDashboard";
import { PantallaMovimientos } from "../modules/movimientos/PantallaMovimientos";
import { PantallaCategorias } from "../modules/parametros/PantallaCategorias";
import { sincronizarCotizaciones } from "../modules/parametros/cotizaciones.servicio";
import { PantallaPrestamos } from "../modules/prestamos/PantallaPrestamos";
import { PantallaRecurrencia } from "../modules/recurrencia/PantallaRecurrencia";
import { aplicarReglasAutomaticas } from "../modules/recurrencia/recurrencia.servicio";
import { PantallaRendimientos } from "../modules/rendimientos/PantallaRendimientos";
import { acreditarInteresPendiente } from "../modules/rendimientos/rendimientos.servicio";
import "./App.css";

type Vista =
  | "dashboard"
  | "movimientos"
  | "cuentas"
  | "categorias"
  | "recurrencia"
  | "rendimientos"
  | "prestamos";

const NAVEGACION: { id: Vista; etiqueta: string }[] = [
  { id: "dashboard", etiqueta: "Dashboard" },
  { id: "movimientos", etiqueta: "Movimientos" },
  { id: "recurrencia", etiqueta: "Recurrentes" },
  { id: "rendimientos", etiqueta: "Rendimientos" },
  { id: "prestamos", etiqueta: "Préstamos" },
  { id: "cuentas", etiqueta: "Cuentas" },
  { id: "categorias", etiqueta: "Categorías" },
];

function App() {
  const [vista, setVista] = useState<Vista>("dashboard");
  const [listo, setListo] = useState(false);

  useEffect(() => {
    async function iniciar() {
      await sincronizarCotizaciones();
      await aplicarReglasAutomaticas();
      await acreditarInteresPendiente();
    }
    iniciar().finally(() => setListo(true));
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
        {vista === "rendimientos" && <PantallaRendimientos />}
        {vista === "prestamos" && <PantallaPrestamos />}
        {vista === "cuentas" && <PantallaCuentas />}
        {vista === "categorias" && <PantallaCategorias />}
      </main>
    </div>
  );
}

export default App;
