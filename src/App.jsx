import { useState } from "react";

// ─── PALETA ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#ffffff",
  surface: "#f0f4ff",
  card: "#ffffff",
  border: "#dbe4f5",
  accent: "#2563eb",
  accentDim: "#1e3a8a",
  accentGlow: "rgba(37,99,235,0.10)",
  gold: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f97316",
  info: "#0ea5e9",
  text: "#0f172a",
  muted: "#475569",
  faint: "#94a3b8",
};

// ─── DATOS GLOBALES ───────────────────────────────────────────────────────────
// ─── NOMBRE DEL RESTAURANTE ───────────────────────────────────────────────────
const NOMBRE_RESTAURANTE = "GastroPRO";
const SUBTITULO_RESTAURANTE = "Sistema de gestión hotelera";

const STOCK = [
  { id: 1, nombre: "Harina de trigo", cantidad: 25, unidad: "kg", minimo: 5, categoria: "Secos" },
  { id: 2, nombre: "Azúcar blanca", cantidad: 15, unidad: "kg", minimo: 3, categoria: "Secos" },
  { id: 3, nombre: "Huevos", cantidad: 60, unidad: "und", minimo: 12, categoria: "Frescos" },
  { id: 4, nombre: "Leche entera", cantidad: 20, unidad: "L", minimo: 5, categoria: "Lácteos" },
  { id: 5, nombre: "Mantequilla", cantidad: 8, unidad: "kg", minimo: 2, categoria: "Lácteos" },
  { id: 6, nombre: "Nata para montar", cantidad: 1.5, unidad: "L", minimo: 2, categoria: "Lácteos" },
  { id: 7, nombre: "Chocolate negro 70%", cantidad: 0.8, unidad: "kg", minimo: 1, categoria: "Repostería" },
];

const PLATOS = [
  { id: 1, nombre: "Tarta de Chocolate", precio: 4.50, vendidos: 34, disponible: true, imagen: "🎂" },
  { id: 2, nombre: "Crema Catalana", precio: 3.80, vendidos: 28, disponible: true, imagen: "🍮" },
  { id: 3, nombre: "Croissant de Mantequilla", precio: 2.20, vendidos: 52, disponible: true, imagen: "🥐" },
  { id: 4, nombre: "Tarta de Nata y Fresas", precio: 5.00, vendidos: 19, disponible: true, imagen: "🍓" },
  { id: 5, nombre: "Brownie Clásico", precio: 3.20, vendidos: 8, disponible: false, imagen: "🍫" },
];

const VENTAS_SEMANA = [
  { dia: "Lun", ventas: 210 },
  { dia: "Mar", ventas: 340 },
  { dia: "Mié", ventas: 290 },
  { dia: "Jue", ventas: 420 },
  { dia: "Vie", ventas: 580 },
  { dia: "Sáb", ventas: 720 },
  { dia: "Dom", ventas: 387 },
];

const ACTIVIDAD = [
  { icono: "💶", texto: "Caja abierta por Carlos Pérez", hora: "09:00", color: C.success },
  { icono: "🍽️", texto: "52 croissants vendidos hoy", hora: "10:30", color: C.gold },
  { icono: "⚠️", texto: "Stock bajo: Nata para montar (1.5L)", hora: "11:00", color: C.warning },
  { icono: "⚠️", texto: "Stock crítico: Chocolate negro (0.8kg)", hora: "11:01", color: C.danger },
  { icono: "👤", texto: "María González inició sesión", hora: "11:15", color: C.info },
  { icono: "🤖", texto: "IA generó sugerencia de compra", hora: "11:20", color: C.accent },
];

const USUARIOS = [
  { nombre: "David Ramírez", rol: "Administrador", avatar: "DR", activo: true, color: C.accent },
  { nombre: "María González", rol: "Supervisora", avatar: "MG", activo: true, color: C.gold },
  { nombre: "Carlos Pérez", rol: "Cajero", avatar: "CP", activo: true, color: C.success },
  { nombre: "Ana Torres", rol: "Cocinera", avatar: "AT", activo: true, color: C.warning },
  { nombre: "Luis Martín", rol: "Mesero", avatar: "LM", activo: false, color: C.faint },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const stockStatus = (i) => {
  if (i.cantidad === 0) return "agotado";
  if (i.cantidad <= i.minimo) return "critico";
  if (i.cantidad <= i.minimo * 2) return "bajo";
  return "ok";
};

const totalIngresos = PLATOS.reduce((s, p) => s + p.precio * p.vendidos, 0);
const maxVenta = Math.max(...VENTAS_SEMANA.map((v) => v.ventas));
const stockAlertas = STOCK.filter((i) => stockStatus(i) !== "ok");

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Avatar = ({ initials, color, size = 32 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28,
    background: color + "22", border: `2px solid ${color}44`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.33, fontWeight: 800, color, flexShrink: 0,
  }}>{initials}</div>
);

const StatCard = ({ icon, label, value, sub, color = C.accent, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
    padding: "18px 20px", display: "flex", gap: 14, alignItems: "center",
    flex: "1 1 160px", minWidth: 140, cursor: onClick ? "pointer" : "default",
    transition: "border-color .2s",
  }}
    onMouseEnter={(e) => onClick && (e.currentTarget.style.borderColor = color + "60")}
    onMouseLeave={(e) => onClick && (e.currentTarget.style.borderColor = C.border)}
  >
    <div style={{
      width: 46, height: 46, borderRadius: 13, background: color + "20",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
    </div>
  </div>
);

// ─── MÓDULOS (vistas completas embebidas simplificadas) ───────────────────────

const ModuloInventario = () => {
  const [stock, setStock] = useState(STOCK);
  const [form, setForm] = useState(null);

  const guardar = () => {
    if (form.id) setStock(stock.map((i) => i.id === form.id ? { ...form, cantidad: +form.cantidad, minimo: +form.minimo } : i));
    else setStock([...stock, { ...form, id: Date.now(), cantidad: +form.cantidad, minimo: +form.minimo }]);
    setForm(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 18 }}>📦 Inventario</h2>
        <button onClick={() => setForm({ nombre: "", cantidad: "", unidad: "kg", minimo: "", categoria: "Secos" })}
          style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          + Añadir
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {stock.map((item) => {
          const st = stockStatus(item);
          const col = { ok: C.success, bajo: C.warning, critico: C.danger, agotado: C.danger }[st];
          return (
            <div key={item.id} style={{ background: C.card, border: `1px solid ${st !== "ok" ? col + "40" : C.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{item.nombre}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{item.categoria}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 15 }}>{item.cantidad} <span style={{ color: C.faint, fontSize: 12 }}>{item.unidad}</span></div>
                <div style={{ fontSize: 11, color: col, fontWeight: 600 }}>{st === "ok" ? "✓ OK" : st === "bajo" ? "⚠ Bajo" : "⛔ Crítico"}</div>
              </div>
              <button onClick={() => setForm({ ...item })} style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer" }}>Editar</button>
            </div>
          );
        })}
      </div>

      {form && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={(e) => e.target === e.currentTarget && setForm(null)}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, width: "100%", maxWidth: 420, padding: 24 }}>
            <h3 style={{ margin: "0 0 20px", color: C.text }}>{form.id ? "Editar" : "Nuevo"} ingrediente</h3>
            {[["Nombre", "nombre", "text"], ["Cantidad", "cantidad", "number"], ["Mínimo", "minimo", "number"]].map(([l, k, t]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 4, fontWeight: 600 }}>{l}</label>
                <input type={t} value={form[k] || ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setForm(null)} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.muted, borderRadius: 10, padding: "8px 16px", cursor: "pointer" }}>Cancelar</button>
              <button onClick={guardar} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ModuloPlatos = () => {
  const [platos, setPlatos] = useState(PLATOS);
  const ordenados = [...platos].sort((a, b) => b.vendidos - a.vendidos);
  const max = ordenados[0]?.vendidos || 1;
  return (
    <div>
      <h2 style={{ margin: "0 0 20px", color: C.text, fontSize: 18 }}>🍽️ Platos & Métricas</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {ordenados.map((p, i) => (
          <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>{p.imagen}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{p.nombre}</span>
                  {i === 0 && <span style={{ fontSize: 10, background: C.gold + "20", color: C.gold, border: `1px solid ${C.gold}30`, borderRadius: 5, padding: "2px 7px", fontWeight: 700 }}>⭐ Top</span>}
                  {!p.disponible && <span style={{ fontSize: 10, background: C.danger + "15", color: C.danger, border: `1px solid ${C.danger}30`, borderRadius: 5, padding: "2px 7px" }}>No disponible</span>}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{p.vendidos} vendidos · €{(p.precio * p.vendidos).toFixed(2)}</div>
              </div>
              <span style={{ fontWeight: 800, color: C.accent, fontSize: 15 }}>€{p.precio.toFixed(2)}</span>
            </div>
            <div style={{ background: C.surface, borderRadius: 6, height: 6 }}>
              <div style={{ height: "100%", borderRadius: 6, background: i === 0 ? C.gold : i === ordenados.length - 1 ? C.danger : C.accent, width: `${(p.vendidos / max) * 100}%`, transition: "width .5s" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ModuloUsuarios = () => (
  <div>
    <h2 style={{ margin: "0 0 20px", color: C.text, fontSize: 18 }}>👥 Usuarios activos</h2>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {USUARIOS.map((u) => (
        <div key={u.nombre} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, opacity: u.activo ? 1 : 0.5 }}>
          <Avatar initials={u.avatar} color={u.color} size={36} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: C.text, fontSize: 14 }}>{u.nombre}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{u.rol}</div>
          </div>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: u.activo ? C.success : C.faint }} />
        </div>
      ))}
    </div>
  </div>
);

const ModuloCarta = () => {
  const carta = [
    { cat: "☕ Desayunos", items: ["Croissant de Mantequilla · €2.20", "Tostada con Tomate · €1.80", "Café con Leche · €1.50"] },
    { cat: "🎂 Postres", items: ["Tarta de Chocolate · €4.50", "Crema Catalana · €3.80", "Tarta de Nata y Fresas · €5.00"] },
    { cat: "🥤 Bebidas", items: ["Agua Mineral · €1.20", "Zumo Natural · €2.50", "Vino de la Casa · €3.00"] },
  ];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 18 }}>📱 Carta Digital QR</h2>
        <div style={{ background: C.success + "15", color: C.success, border: `1px solid ${C.success}30`, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600 }}>● Activa</div>
      </div>
      <div style={{ background: C.accentGlow, border: `1px solid ${C.accent}30`, borderRadius: 14, padding: 16, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>▣</div>
        <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>gastropro.es/carta/restaurante-demo</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Escanea · Sin descargas · Tiempo real</div>
      </div>
      {carta.map((c) => (
        <div key={c.cat} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>{c.cat}</div>
          {c.items.map((item) => (
            <div key={item} style={{ fontSize: 13, color: C.muted, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>{item}</div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────────────────────
const Dashboard = () => (
  <div>
    {/* KPIs */}
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
      <StatCard icon="💶" label="Ingresos totales" value={`€${totalIngresos.toFixed(0)}`} sub="Estimado acumulado" color={C.gold} />
      <StatCard icon="🥐" label="Más vendido" value="Croissant" sub="52 unidades" color={C.success} />
      <StatCard icon="⚠️" label="Alertas stock" value={stockAlertas.length} sub={stockAlertas.length > 0 ? "Requieren atención" : "Todo OK"} color={stockAlertas.length > 0 ? C.danger : C.success} />
      <StatCard icon="👥" label="Usuarios activos" value={USUARIOS.filter((u) => u.activo).length} sub={`de ${USUARIOS.length} registrados`} color={C.info} />
    </div>

    {/* Gráfico de ventas semanales */}
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 20 }}>
      <h3 style={{ margin: "0 0 20px", color: C.text, fontSize: 15 }}>📊 Ventas esta semana</h3>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
        {VENTAS_SEMANA.map((v, i) => (
          <div key={v.dia} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>€{v.ventas}</div>
            <div style={{
              width: "100%", borderRadius: "6px 6px 0 0",
              background: i === 5 ? C.gold : i === 6 ? C.accent : C.accentDim + "60",
              height: `${(v.ventas / maxVenta) * 90}px`,
              transition: "height .5s",
              border: i === 5 || i === 6 ? "none" : `1px solid ${C.border}`,
            }} />
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{v.dia}</div>
          </div>
        ))}
      </div>
    </div>

    {/* Actividad reciente + Stock crítico */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 14 }}>⚡ Actividad reciente</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ACTIVIDAD.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: a.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{a.icono}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.4 }}>{a.texto}</div>
                <div style={{ fontSize: 10, color: C.faint }}>{a.hora}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 14 }}>⚠️ Alertas de stock</h3>
        {stockAlertas.length === 0 ? (
          <div style={{ textAlign: "center", padding: 24, color: C.success }}>✅ Todo el stock en orden</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {stockAlertas.map((i) => {
              const st = stockStatus(i);
              const col = st === "critico" || st === "agotado" ? C.danger : C.warning;
              return (
                <div key={i.id} style={{ background: col + "10", border: `1px solid ${col}30`, borderRadius: 10, padding: "10px 14px" }}>
                  <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{i.nombre}</div>
                  <div style={{ fontSize: 12, color: col, marginTop: 2 }}>
                    {i.cantidad} {i.unidad} disponibles · mínimo {i.minimo} {i.unidad}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <h3 style={{ margin: "0 0 12px", color: C.text, fontSize: 14 }}>🏆 Top platos hoy</h3>
          {[...PLATOS].sort((a, b) => b.vendidos - a.vendidos).slice(0, 3).map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 16 }}>{["🥇", "🥈", "🥉"][i]}</span>
              <span style={{ flex: 1, fontSize: 13, color: C.text }}>{p.nombre}</span>
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{p.vendidos} uds.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ─── NAV ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "🏠" },
  { id: "inventario", label: "Inventario", icon: "📦" },
  { id: "platos", label: "Platos", icon: "🍽️" },
  { id: "usuarios", label: "Usuarios", icon: "👥" },
  { id: "carta", label: "Carta QR", icon: "📱" },
];

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");

  const renderTab = () => {
    if (tab === "dashboard")  return <Dashboard />;
    if (tab === "inventario") return <ModuloInventario />;
    if (tab === "platos")     return <ModuloPlatos />;
    if (tab === "usuarios")   return <ModuloUsuarios />;
    if (tab === "carta")      return <ModuloCarta />;
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(37,99,235,0.07)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, height: 58 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>👨‍🍳</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.text, lineHeight: 1 }}>{NOMBRE_RESTAURANTE}</div>
              <div style={{ fontSize: 10, color: C.faint }}>{SUBTITULO_RESTAURANTE}</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <nav style={{ display: "flex", gap: 2 }}>
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? C.accentGlow : "transparent",
                color: tab === t.id ? C.accent : C.muted,
                border: `1px solid ${tab === t.id ? C.accent + "40" : "transparent"}`,
                borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 5,
              }}>
                <span>{t.icon}</span>
                <span style={{ display: "none", "@media(min-width:640px)": { display: "inline" } }}>{t.label}</span>
              </button>
            ))}
          </nav>
          <div style={{ background: C.accentGlow, border: `1px solid ${C.accent}30`, borderRadius: 8, padding: "5px 12px", fontSize: 11, color: C.accent, fontWeight: 600 }}>
            👑 Admin
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {renderTab()}
      </div>
    </div>
  );
}