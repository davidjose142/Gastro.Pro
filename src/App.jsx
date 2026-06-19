import { useState, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
//  GASTROPRO — SISTEMA COMPLETO DE GESTIÓN HOTELERA
//  Conectado a Supabase · Login real · Roles y permisos
// ═══════════════════════════════════════════════════════════════════════════════

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://jwrhgseculraqouljncw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cmhnc2VjdWxyYXFvdWxqbmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NjE5ODMsImV4cCI6MjA5NzMzNzk4M30.5JargPVMn1kP7c6eXBjdf2LzKkkcSrKcywUMRat2Pus";

const db = async (tabla, opciones = {}) => {
  const { metodo = "GET", cuerpo, filtro = "" } = opciones;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabla}${filtro}`, {
      method: metodo,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": metodo === "POST" || metodo === "PATCH" ? "return=representation" : "",
      },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    if (metodo === "DELETE") return true;
    return await res.json();
  } catch (e) {
    console.error("Error db:", e);
    return null;
  }
};

// ─── PALETA ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#f0f4fa", surface: "#ffffff", card: "#ffffff", soft: "#f1f5f9", border: "#e2e8f0",
  sidebar: "#0f172a", sidebarBorder: "rgba(255,255,255,0.06)", sidebarText: "rgba(255,255,255,0.55)",
  accent: "#2563eb", accentLight: "#eff6ff", accentDim: "#1e3a8a",
  gold: "#f59e0b", goldLight: "#fffbeb", success: "#10b981", successLight: "#ecfdf5",
  danger: "#ef4444", dangerLight: "#fef2f2", warning: "#f97316", warningLight: "#fff7ed",
  info: "#0ea5e9", purple: "#8b5cf6",
  text: "#0f172a", muted: "#64748b", faint: "#94a3b8",
};

// ─── ROLES ────────────────────────────────────────────────────────────────────
const ROLES = {
  administrador: { label: "Administrador", color: C.accent, icono: "👑" },
  supervisor: { label: "Supervisor", color: C.gold, icono: "⭐" },
  cajero: { label: "Cajero", color: C.success, icono: "💶" },
  cocinero: { label: "Cocinero", color: C.warning, icono: "👨‍🍳" },
  mesero: { label: "Mesero", color: C.info, icono: "🍽️" },
};
const esAdmin = (r) => r === "administrador";
const puedeEditar = (r) => ["administrador", "supervisor"].includes(r);

// ─── NAVEGACIÓN ───────────────────────────────────────────────────────────────
const NAV = [
  { id: "dashboard", icon: "🏠", label: "Dashboard", grupo: "Operaciones" },
  { id: "mesas", icon: "🪑", label: "Mesas", grupo: "Operaciones" },
  { id: "tickets", icon: "🧾", label: "TPV / Tickets", grupo: "Operaciones" },
  { id: "cocina", icon: "🍳", label: "Cocina (KDS)", grupo: "Operaciones" },
  { id: "reservas", icon: "📅", label: "Reservas", grupo: "Operaciones" },
  { id: "inventario", icon: "📦", label: "Inventario", grupo: "Gestión" },
  { id: "platos", icon: "🍽️", label: "Carta & Platos", grupo: "Gestión" },
  { id: "mermas", icon: "🗑️", label: "Mermas", grupo: "Gestión" },
  { id: "caja", icon: "💶", label: "Caja", grupo: "Gestión" },
  { id: "reportes", icon: "📊", label: "Reportes", grupo: "Gestión" },
  { id: "ia", icon: "🤖", label: "Asistente IA", grupo: "Sistema" },
  { id: "usuarios", icon: "👥", label: "Usuarios", grupo: "Sistema", adminOnly: true },
  { id: "config", icon: "⚙️", label: "Configuración", grupo: "Sistema", adminOnly: true },
];

// ─── ATOMS ────────────────────────────────────────────────────────────────────
const Avatar = ({ initials, color = C.accent, size = 32, online }) => (
  <div style={{ position: "relative", flexShrink: 0 }}>
    <div style={{ width: size, height: size, borderRadius: size * 0.3, background: color + "20", border: `2px solid ${color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 800, color }}>{initials}</div>
    {online !== undefined && <div style={{ position: "absolute", bottom: -1, right: -1, width: 9, height: 9, borderRadius: "50%", background: online ? C.success : C.faint, border: "2px solid white" }} />}
  </div>
);

const Btn = ({ children, onClick, variant = "primary", small, full, disabled, icon }) => {
  const v = {
    primary: { background: C.accent, color: "#fff", border: "none" },
    success: { background: C.success, color: "#fff", border: "none" },
    danger: { background: C.danger, color: "#fff", border: "none" },
    secondary: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    ghost: { background: "transparent", color: C.accent, border: `1px solid ${C.accent}30` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...v[variant], borderRadius: 10, padding: small ? "6px 14px" : "10px 20px", fontSize: small ? 12 : 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center", gap: 7, justifyContent: "center" }}>{icon && <span>{icon}</span>}{children}</button>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 600 }}>{label}</label>}
    <input {...props} style={{ width: "100%", background: C.soft, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", ...props.style }} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 600 }}>{label}</label>}
    <select {...props} style={{ width: "100%", background: C.soft, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 14, outline: "none" }}>{children}</select>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 11, background: checked ? C.accent : C.border, position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0 }}>
    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: checked ? 21 : 3, transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
  </div>
);

const Modal = ({ title, subtitle, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div style={{ background: C.card, borderRadius: 20, width: "100%", maxWidth: 480, maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(15,23,42,.2)" }}>
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}` }}>
        <h3 style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 800 }}>{title}</h3>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>{subtitle}</p>}
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const Toast = ({ msg, color }) => (
  <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: color + "15", border: `1px solid ${color}40`, borderRadius: 12, padding: "12px 20px", color, fontWeight: 700, fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,.1)" }}>{msg}</div>
);

const Cargando = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
    <div style={{ textAlign: "center", color: C.muted }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>⏳</div>
      <div style={{ fontSize: 13 }}>Cargando...</div>
    </div>
  </div>
);

const KPICard = ({ icon, label, value, sub, color = C.accent }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px", flex: "1 1 160px", boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
    <div style={{ width: 42, height: 42, borderRadius: 12, background: color + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 24, fontWeight: 900, color: C.text, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color, fontWeight: 600, marginTop: 3 }}>{sub}</div>}
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = async () => {
    if (!email.trim()) return;
    setCargando(true); setError("");
    const usuarios = await db("usuarios", { filtro: `?email=eq.${encodeURIComponent(email)}&activo=eq.true` });
    if (usuarios?.length > 0) onLogin(usuarios[0]);
    else setError("Usuario no encontrado o inactivo");
    setCargando(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, ${C.accentDim} 0%, ${C.accent} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: 16 }}>
      <div style={{ background: C.card, borderRadius: 24, padding: "48px 40px", width: "100%", maxWidth: 400, boxShadow: "0 30px 80px rgba(0,0,0,0.3)", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px", background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30 }}>👨‍🍳</div>
        <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 900, color: C.text }}>GastroPRO</h1>
        <p style={{ margin: "0 0 32px", color: C.muted, fontSize: 13 }}>Sistema de gestión hotelera</p>
        <Input label="Tu correo electrónico" type="email" placeholder="correo@restaurante.es" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && entrar()} />
        {error && <div style={{ color: C.danger, fontSize: 12, marginBottom: 12 }}>⚠️ {error}</div>}
        <Btn full onClick={entrar} disabled={cargando}>{cargando ? "Verificando..." : "Entrar al sistema"}</Btn>
        <div style={{ marginTop: 24, fontSize: 11, color: C.faint }}>Demo: davidjose142@gmail.com</div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard = ({ usuario }) => {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    (async () => {
      const [platos, inventario, usuarios] = await Promise.all([
        db("platos", { filtro: "?order=vendidos.desc" }),
        db("inventario"),
        db("usuarios"),
      ]);
      setDatos({ platos: platos || [], inventario: inventario || [], usuarios: usuarios || [] });
    })();
  }, []);

  if (!datos) return <Cargando />;
  const { platos, inventario, usuarios } = datos;
  const ingresos = platos.reduce((s, p) => s + p.precio * p.vendidos, 0);
  const alertas = inventario.filter((i) => i.cantidad <= i.minimo);
  const maxV = Math.max(...platos.map((p) => p.vendidos), 1);

  const VENTAS_SEMANA = [312, 428, 356, 510, 687, 842, ingresos].map((v, i) => ({ dia: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Hoy"][i], v }));
  const maxSemana = Math.max(...VENTAS_SEMANA.map((v) => v.v));

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text }}>Hola, {usuario.nombre.split(" ")[0]} 👋</h1>
        <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 14 }}>{new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <KPICard icon="💶" label="Ingresos acumulados" value={`€${ingresos.toFixed(0)}`} color={C.success} />
        <KPICard icon="🍽️" label="Platos en carta" value={platos.length} color={C.accent} />
        <KPICard icon="⚠️" label="Alertas de stock" value={alertas.length} color={alertas.length > 0 ? C.danger : C.success} sub={alertas.length > 0 ? "Requieren atención" : "Todo OK"} />
        <KPICard icon="👥" label="Usuarios activos" value={usuarios.filter((u) => u.activo).length} color={C.purple} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 800, color: C.text }}>📊 Ventas de la semana</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {VENTAS_SEMANA.map((v, i) => (
              <div key={v.dia} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <div style={{ fontSize: 10, color: i === 6 ? C.accent : C.faint, fontWeight: 700 }}>€{v.v.toFixed(0)}</div>
                <div style={{ width: "100%", borderRadius: "6px 6px 0 0", background: i === 6 ? C.accent : C.border, height: `${(v.v / maxSemana) * 100}px`, minHeight: 4, transition: "height .5s" }} />
                <div style={{ fontSize: 11, color: i === 6 ? C.accent : C.faint, fontWeight: i === 6 ? 800 : 500 }}>{v.dia}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.text }}>🏆 Top platos</h3>
          {platos.slice(0, 5).map((p, i) => (
            <div key={p.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{["🥇", "🥈", "🥉", "4.", "5."][i]} {p.imagen} {p.nombre}</span>
                <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{p.vendidos} uds.</span>
              </div>
              <div style={{ background: C.soft, borderRadius: 4, height: 5 }}>
                <div style={{ height: "100%", borderRadius: 4, background: i === 0 ? C.gold : C.accent, width: `${(p.vendidos / maxV) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {alertas.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.danger}30`, borderRadius: 16, padding: 22, marginTop: 16, boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: C.danger }}>⚠️ Alertas de stock</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {alertas.map((i) => (
              <div key={i.id} style={{ background: C.dangerLight, borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 13 }}>{i.nombre}</div>
                <div style={{ fontSize: 12, color: C.danger }}>{i.cantidad} {i.unidad} · mín. {i.minimo} {i.unidad}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  INVENTARIO
// ═══════════════════════════════════════════════════════════════════════════════
const ModuloInventario = ({ usuario, toast }) => {
  const [items, setItems] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const cargar = async () => setItems(await db("inventario", { filtro: "?order=nombre" }) || []);
  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    const cuerpo = { nombre: form.nombre, cantidad: +form.cantidad, unidad: form.unidad, minimo: +form.minimo, categoria: form.categoria };
    if (form.id) await db("inventario", { metodo: "PATCH", filtro: `?id=eq.${form.id}`, cuerpo });
    else await db("inventario", { metodo: "POST", cuerpo });
    toast("✅ Guardado en base de datos");
    setModal(null); cargar();
  };

  const eliminar = async (id) => { await db("inventario", { metodo: "DELETE", filtro: `?id=eq.${id}` }); toast("🗑️ Eliminado", C.warning); cargar(); };

  const st = (i) => i.cantidad <= 0 ? { l: "Agotado", c: C.danger } : i.cantidad <= i.minimo ? { l: "Crítico", c: C.danger } : i.cantidad <= i.minimo * 2 ? { l: "Bajo", c: C.warning } : { l: "OK", c: C.success };

  if (!items) return <Cargando />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>📦 Inventario</h2>
        {puedeEditar(usuario.rol) && <Btn onClick={() => { setForm({ nombre: "", cantidad: "", unidad: "kg", minimo: "", categoria: "Secos" }); setModal("n"); }} icon="+">Añadir</Btn>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => {
          const s = st(item);
          return (
            <div key={item.id} style={{ background: C.card, border: `1px solid ${item.cantidad <= item.minimo ? s.c + "40" : C.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{item.nombre}</div>
                <div style={{ fontSize: 11, color: C.faint }}>{item.categoria}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, color: C.text }}>{item.cantidad} <span style={{ color: C.faint, fontSize: 12 }}>{item.unidad}</span></div>
                <div style={{ fontSize: 11, color: s.c, fontWeight: 700 }}>{s.l}</div>
              </div>
              {puedeEditar(usuario.rol) && (
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small variant="ghost" onClick={() => { setForm({ ...item }); setModal("e"); }}>Editar</Btn>
                  {esAdmin(usuario.rol) && <Btn small variant="danger" onClick={() => eliminar(item.id)}>✕</Btn>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {modal && (
        <Modal title={modal === "n" ? "Nuevo ingrediente" : "Editar ingrediente"} onClose={() => setModal(null)}>
          <Input label="Nombre" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Cantidad" type="number" value={form.cantidad || ""} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
            <Select label="Unidad" value={form.unidad || "kg"} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>{["kg", "g", "L", "ml", "und"].map((u) => <option key={u}>{u}</option>)}</Select>
          </div>
          <Input label="Stock mínimo" type="number" value={form.minimo || ""} onChange={(e) => setForm({ ...form, minimo: e.target.value })} />
          <Select label="Categoría" value={form.categoria || "Secos"} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>{["Secos", "Frescos", "Lácteos", "Repostería", "Aromas", "Condimentos", "Bebidas"].map((c) => <option key={c}>{c}</option>)}</Select>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={guardar}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  PLATOS
// ═══════════════════════════════════════════════════════════════════════════════
const ModuloPlatos = ({ usuario, toast }) => {
  const [platos, setPlatos] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const cargar = async () => setPlatos(await db("platos", { filtro: "?order=vendidos.desc" }) || []);
  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    const cuerpo = { nombre: form.nombre, descripcion: form.descripcion, precio: +form.precio, categoria: form.categoria, imagen: form.imagen, disponible: form.disponible ?? true };
    if (form.id) await db("platos", { metodo: "PATCH", filtro: `?id=eq.${form.id}`, cuerpo });
    else await db("platos", { metodo: "POST", cuerpo: { ...cuerpo, vendidos: 0 } });
    toast("✅ Guardado");
    setModal(null); cargar();
  };
  const eliminar = async (id) => { await db("platos", { metodo: "DELETE", filtro: `?id=eq.${id}` }); toast("🗑️ Eliminado", C.warning); cargar(); };
  const toggle = async (p) => { await db("platos", { metodo: "PATCH", filtro: `?id=eq.${p.id}`, cuerpo: { disponible: !p.disponible } }); cargar(); };

  if (!platos) return <Cargando />;
  const max = Math.max(...platos.map((p) => p.vendidos), 1);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>🍽️ Carta & Platos</h2>
        {puedeEditar(usuario.rol) && <Btn onClick={() => { setForm({ nombre: "", descripcion: "", precio: "", categoria: "Postres", imagen: "🍽️", disponible: true }); setModal("n"); }} icon="+">Nuevo plato</Btn>}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {platos.map((p, i) => (
          <div key={p.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 26 }}>{p.imagen}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{p.nombre}</span>
                  {i === 0 && <span style={{ fontSize: 10, background: C.goldLight, color: C.gold, border: `1px solid ${C.gold}30`, borderRadius: 5, padding: "2px 7px", fontWeight: 700 }}>⭐ Top</span>}
                  {!p.disponible && <span style={{ fontSize: 10, background: C.dangerLight, color: C.danger, borderRadius: 5, padding: "2px 7px" }}>No disponible</span>}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{p.vendidos} vendidos · €{(p.precio * p.vendidos).toFixed(2)}</div>
              </div>
              <span style={{ fontWeight: 800, color: C.accent, fontSize: 16 }}>€{Number(p.precio).toFixed(2)}</span>
              {puedeEditar(usuario.rol) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Toggle checked={p.disponible} onChange={() => toggle(p)} />
                  <Btn small variant="ghost" onClick={() => { setForm({ ...p }); setModal("e"); }}>Editar</Btn>
                  {esAdmin(usuario.rol) && <Btn small variant="danger" onClick={() => eliminar(p.id)}>✕</Btn>}
                </div>
              )}
            </div>
            <div style={{ background: C.soft, borderRadius: 6, height: 6 }}>
              <div style={{ height: "100%", borderRadius: 6, background: i === 0 ? C.gold : C.accent, width: `${(p.vendidos / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <Modal title={modal === "n" ? "Nuevo plato" : "Editar plato"} onClose={() => setModal(null)}>
          <Input label="Nombre" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Input label="Descripción" value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Precio (€)" type="number" value={form.precio || ""} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
            <Input label="Emoji" value={form.imagen || ""} onChange={(e) => setForm({ ...form, imagen: e.target.value })} />
          </div>
          <Select label="Categoría" value={form.categoria || "Postres"} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>{["Postres", "Panadería", "Repostería", "Entrantes", "Principales", "Bebidas", "Desayunos"].map((c) => <option key={c}>{c}</option>)}</Select>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={guardar}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  USUARIOS
// ═══════════════════════════════════════════════════════════════════════════════
const ModuloUsuarios = ({ usuario, toast }) => {
  const [usuarios, setUsuarios] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const cargar = async () => setUsuarios(await db("usuarios", { filtro: "?order=nombre" }) || []);
  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    const avatar = form.nombre?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const cuerpo = { nombre: form.nombre, email: form.email, rol: form.rol, activo: form.activo ?? true, avatar };
    if (form.id) await db("usuarios", { metodo: "PATCH", filtro: `?id=eq.${form.id}`, cuerpo });
    else await db("usuarios", { metodo: "POST", cuerpo });
    toast("✅ Guardado");
    setModal(null); cargar();
  };
  const eliminar = async (u) => { if (u.id === usuario.id) { toast("⚠️ No puedes eliminarte", C.danger); return; } await db("usuarios", { metodo: "DELETE", filtro: `?id=eq.${u.id}` }); toast("🗑️ Eliminado", C.warning); cargar(); };
  const toggleActivo = async (u) => { if (u.id === usuario.id) return; await db("usuarios", { metodo: "PATCH", filtro: `?id=eq.${u.id}`, cuerpo: { activo: !u.activo } }); cargar(); };

  if (!usuarios) return <Cargando />;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>👥 Usuarios & Permisos</h2>
        <Btn onClick={() => { setForm({ nombre: "", email: "", rol: "mesero", activo: true }); setModal("n"); }} icon="+">Crear usuario</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {usuarios.map((u) => {
          const rol = ROLES[u.rol]; const mio = u.id === usuario.id;
          return (
            <div key={u.id} style={{ background: C.card, border: `1px solid ${mio ? C.accent + "40" : C.border}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", opacity: u.activo ? 1 : 0.55, boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
              <Avatar initials={u.avatar} color={rol?.color} />
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{u.nombre}</span>
                  {mio && <span style={{ fontSize: 10, background: C.accentLight, color: C.accent, border: `1px solid ${C.accent}30`, borderRadius: 5, padding: "2px 7px", fontWeight: 700 }}>TÚ</span>}
                </div>
                <div style={{ fontSize: 12, color: C.faint }}>{u.email}</div>
              </div>
              <span style={{ background: (rol?.color || C.accent) + "15", color: rol?.color, border: `1px solid ${rol?.color}25`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{rol?.icono} {rol?.label}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Toggle checked={u.activo} onChange={() => toggleActivo(u)} />
                <Btn small variant="ghost" onClick={() => { setForm({ ...u }); setModal("e"); }}>Editar</Btn>
                <Btn small variant="danger" onClick={() => eliminar(u)} disabled={mio}>✕</Btn>
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <Modal title={modal === "n" ? "Crear usuario" : "Editar usuario"} subtitle="Los permisos se asignan según el rol" onClose={() => setModal(null)}>
          <Input label="Nombre completo" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Input label="Correo electrónico" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Rol" value={form.rol || "mesero"} onChange={(e) => setForm({ ...form, rol: e.target.value })}>{Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.icono} {r.label}</option>)}</Select>
          <div style={{ background: C.soft, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 12, color: C.muted }}>
            {form.rol === "administrador" && "✅ Acceso total al sistema"}
            {form.rol === "supervisor" && "⭐ Edita platos e inventario, ve usuarios"}
            {form.rol === "cajero" && "💶 Registra ventas y maneja caja"}
            {form.rol === "cocinero" && "👨‍🍳 Ve y edita inventario"}
            {form.rol === "mesero" && "🍽️ Toma comandas y ve la carta"}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={guardar} disabled={!form.nombre || !form.email}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  CONFIGURACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
const ModuloConfig = ({ usuario, toast }) => {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => { (async () => { const d = await db("configuracion", { filtro: "?limit=1" }); if (d?.[0]) { setConfig(d[0]); setForm(d[0]); } })(); }, []);

  const guardar = async () => {
    await db("configuracion", { metodo: "PATCH", filtro: `?id=eq.${config.id}`, cuerpo: { nombre: form.nombre, slogan: form.slogan, telefono: form.telefono, horario: form.horario } });
    toast("✅ Configuración guardada");
  };

  if (!config) return <Cargando />;
  return (
    <div>
      <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800, color: C.text }}>⚙️ Configuración del restaurante</h2>
      <div style={{ maxWidth: 600, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
        <Input label="Nombre del restaurante" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <Input label="Slogan" value={form.slogan || ""} onChange={(e) => setForm({ ...form, slogan: e.target.value })} />
        <Input label="Teléfono" value={form.telefono || ""} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        <Input label="Horario" value={form.horario || ""} onChange={(e) => setForm({ ...form, horario: e.target.value })} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <Btn onClick={guardar} icon="💾">Guardar configuración</Btn>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
//  MÓDULOS DEMO (mesas, tickets, cocina, etc. — versiones integradas)
// ═══════════════════════════════════════════════════════════════════════════════
const ModuloPendiente = ({ titulo, icon, descripcion }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
    <div style={{ textAlign: "center", maxWidth: 400 }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>{icon}</div>
      <h2 style={{ margin: "0 0 8px", color: C.text, fontSize: 20, fontWeight: 800 }}>{titulo}</h2>
      <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.6, margin: 0 }}>{descripcion}</p>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
//  APP PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState(null);

  const mostrarToast = (msg, color = C.success) => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };

  if (!usuario) return <Login onLogin={setUsuario} />;

  const navVisible = NAV.filter((n) => !n.adminOnly || esAdmin(usuario.rol));
  const grupos = [...new Set(navVisible.map((n) => n.grupo))];
  const rolActual = ROLES[usuario.rol];
  const navActual = NAV.find((n) => n.id === tab);

  const render = () => {
    switch (tab) {
      case "dashboard": return <Dashboard usuario={usuario} />;
      case "inventario": return <ModuloInventario usuario={usuario} toast={mostrarToast} />;
      case "platos": return <ModuloPlatos usuario={usuario} toast={mostrarToast} />;
      case "usuarios": return <ModuloUsuarios usuario={usuario} toast={mostrarToast} />;
      case "config": return <ModuloConfig usuario={usuario} toast={mostrarToast} />;
      case "mesas": return <ModuloPendiente titulo="Mesas del salón" icon="🪑" descripcion="Plano interactivo del salón con gestión de pedidos por mesa. Disponible en el módulo gastro-mesas.jsx" />;
      case "tickets": return <ModuloPendiente titulo="TPV / Tickets" icon="🧾" descripcion="Terminal de venta con generación e impresión de tickets. Disponible en el módulo gastro-tickets.jsx" />;
      case "cocina": return <ModuloPendiente titulo="Pantalla de Cocina" icon="🍳" descripcion="Vista KDS para cocina con temporizadores. Disponible en el módulo gastro-cocina.jsx" />;
      case "reservas": return <ModuloPendiente titulo="Reservas" icon="📅" descripcion="Agenda de reservas por día. Disponible en el módulo gastro-reservas.jsx" />;
      case "mermas": return <ModuloPendiente titulo="Control de Mermas" icon="🗑️" descripcion="Registro de pérdidas y desperdicio. Disponible en el módulo gastro-mermas.jsx" />;
      case "caja": return <ModuloPendiente titulo="Control de Caja" icon="💶" descripcion="Apertura y cierre de caja con arqueo. Disponible en el módulo gastro-caja.jsx" />;
      case "reportes": return <ModuloPendiente titulo="Reportes" icon="📊" descripcion="Análisis avanzado exportable a PDF. Disponible en el módulo gastro-reportes.jsx" />;
      case "ia": return <ModuloPendiente titulo="Asistente IA" icon="🤖" descripcion="El chat de IA requiere un backend para proteger la clave de API. Disponible en gastro-ia.jsx para conectar más adelante." />;
      default: return null;
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: C.bg, overflow: "hidden" }}>
      {toast && <Toast {...toast} />}

      {/* Sidebar */}
      <div style={{ width: collapsed ? 64 : 230, background: C.sidebar, display: "flex", flexDirection: "column", flexShrink: 0, transition: "width .25s", overflow: "hidden" }}>
        <div style={{ padding: collapsed ? "20px 0" : "20px 18px", borderBottom: `1px solid ${C.sidebarBorder}`, display: "flex", alignItems: "center", gap: 10, justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👨‍🍳</div>
          {!collapsed && <div><div style={{ fontWeight: 800, fontSize: 14, color: "#fff" }}>GastroPRO</div><div style={{ fontSize: 10, color: C.sidebarText }}>v2.0 · Pro</div></div>}
        </div>

        <div style={{ flex: 1, padding: collapsed ? "12px 8px" : "12px 10px", overflowY: "auto" }}>
          {grupos.map((grupo) => (
            <div key={grupo}>
              {!collapsed && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 800, letterSpacing: 1.5, padding: "10px 8px 4px", textTransform: "uppercase" }}>{grupo}</div>}
              {navVisible.filter((n) => n.grupo === grupo).map((n) => (
                <button key={n.id} onClick={() => setTab(n.id)} title={collapsed ? n.label : ""} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: collapsed ? "10px 0" : "9px 10px", borderRadius: 10, border: "none", marginBottom: 2, background: tab === n.id ? C.accent : "transparent", color: tab === n.id ? "#fff" : C.sidebarText, cursor: "pointer", justifyContent: collapsed ? "center" : "flex-start" }}>
                  <span style={{ fontSize: 17, flexShrink: 0 }}>{n.icon}</span>
                  {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>{n.label}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>

        <button onClick={() => setCollapsed(!collapsed)} style={{ background: "transparent", border: "none", color: C.sidebarText, padding: 12, cursor: "pointer", fontSize: 14, borderTop: `1px solid ${C.sidebarBorder}` }}>{collapsed ? "→" : "←"}</button>
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 28px", height: 58, display: "flex", alignItems: "center", gap: 14, flexShrink: 0, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>{navActual?.icon} {navActual?.label}</h2>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 600 }}>{new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.accentLight, border: `1px solid ${C.accent}25`, borderRadius: 10, padding: "6px 12px" }}>
            <Avatar initials={usuario.avatar} color={rolActual?.color} size={26} online />
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.text, lineHeight: 1 }}>{usuario.nombre.split(" ")[0]}</div>
              <div style={{ fontSize: 10, color: rolActual?.color }}>{rolActual?.icono} {rolActual?.label}</div>
            </div>
          </div>
          <button onClick={() => setUsuario(null)} style={{ background: C.soft, border: `1px solid ${C.border}`, color: C.muted, borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Salir</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>{render()}</div>
      </div>
    </div>
  );
}