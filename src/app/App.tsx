import { useEffect, useState } from "react";
import { PantallaCuentas } from "../modules/cuentas/PantallaCuentas";
import { PantallaDashboard } from "../modules/dashboard/PantallaDashboard";
import { PantallaMovimientos } from "../modules/movimientos/PantallaMovimientos";
import { PantallaCategorias } from "../modules/parametros/PantallaCategorias";
import { sincronizarPrecios } from "../modules/instrumentos/instrumentos.servicio";
import { sincronizarCotizaciones } from "../modules/parametros/cotizaciones.servicio";
import { PantallaPrestamos } from "../modules/prestamos/PantallaPrestamos";
import { PantallaProyeccion } from "../modules/proyeccion/PantallaProyeccion";
import { PantallaRecurrencia } from "../modules/recurrencia/PantallaRecurrencia";
import { aplicarReglasAutomaticas } from "../modules/recurrencia/recurrencia.servicio";
import { PantallaRendimientos } from "../modules/rendimientos/PantallaRendimientos";
import { acreditarInteresPendiente } from "../modules/rendimientos/rendimientos.servicio";
import { PantallaRespaldo } from "../modules/respaldo/PantallaRespaldo";
import { crearRespaldoAutomatico } from "../modules/respaldo/respaldo.servicio";
import "./App.css";

type Vista =
  | "dashboard"
  | "movimientos"
  | "cuentas"
  | "categorias"
  | "recurrencia"
  | "rendimientos"
  | "prestamos"
  | "proyeccion"
  | "respaldo";

const NAVEGACION: { id: Vista; etiqueta: string }[] = [
  { id: "dashboard", etiqueta: "Dashboard" },
  { id: "movimientos", etiqueta: "Movimientos" },
  { id: "recurrencia", etiqueta: "Recurrentes" },
  { id: "rendimientos", etiqueta: "Rendimientos" },
  { id: "prestamos", etiqueta: "Préstamos" },
  { id: "proyeccion", etiqueta: "Proyección" },
  { id: "cuentas", etiqueta: "Cuentas" },
  { id: "categorias", etiqueta: "Categorías" },
  { id: "respaldo", etiqueta: "Respaldo" },
];

function App() {
  const [vista, setVista] = useState<Vista>("dashboard");
  const [menuVisible, setMenuVisible] = useState(true);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    async function iniciar() {
      await crearRespaldoAutomatico();
      await sincronizarCotizaciones();
      await sincronizarPrecios();
      await aplicarReglasAutomaticas();
      await acreditarInteresPendiente();
    }
    iniciar().finally(() => setListo(true));
  }, []);

  useEffect(() => {
    function alPresionar(evento: KeyboardEvent) {
      if (
        evento.altKey &&
        !evento.ctrlKey &&
        evento.key >= "1" &&
        evento.key <= "9"
      ) {
        const indice = Number(evento.key) - 1;
        if (indice < NAVEGACION.length) {
          evento.preventDefault();
          setVista(NAVEGACION[indice].id);
        }
      } else if (evento.ctrlKey && evento.key.toLowerCase() === "b") {
        evento.preventDefault();
        setMenuVisible((visible) => !visible);
      }
    }
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, []);

  if (!listo) {
    return <div className="cargando-app">Cargando…</div>;
  }

  return (
    <div className="app">
      <aside
        className={menuVisible ? "barra-lateral" : "barra-lateral colapsada"}
      >
        {menuVisible ? (
          <>
            <div className="barra-cabecera">
              <h1 className="marca">Finanzas</h1>
              <button
                type="button"
                className="boton-menu"
                onClick={() => setMenuVisible(false)}
                title="Ocultar menú (Ctrl+B)"
                aria-label="Ocultar menú"
              >
                ‹
              </button>
            </div>
            <nav className="navegacion">
              {NAVEGACION.map((item, indice) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    item.id === vista ? "nav-item activo" : "nav-item"
                  }
                  onClick={() => setVista(item.id)}
                  title={`Alt+${indice + 1}`}
                >
                  {item.etiqueta}
                </button>
              ))}
            </nav>
          </>
        ) : (
          <button
            type="button"
            className="boton-menu"
            onClick={() => setMenuVisible(true)}
            title="Mostrar menú (Ctrl+B)"
            aria-label="Mostrar menú"
          >
            ☰
          </button>
        )}
      </aside>
      <main className="contenido">
        {vista === "dashboard" && <PantallaDashboard />}
        {vista === "movimientos" && <PantallaMovimientos />}
        {vista === "recurrencia" && <PantallaRecurrencia />}
        {vista === "rendimientos" && <PantallaRendimientos />}
        {vista === "prestamos" && <PantallaPrestamos />}
        {vista === "proyeccion" && <PantallaProyeccion />}
        {vista === "cuentas" && <PantallaCuentas />}
        {vista === "categorias" && <PantallaCategorias />}
        {vista === "respaldo" && <PantallaRespaldo />}
      </main>
    </div>
  );
}

export default App;
