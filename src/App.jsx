import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
//  CUCHARAL — SISTEMA COMPLETO DE GESTIÓN HOTELERA
//  Conectado a Supabase · Login real · Roles y permisos
// ═══════════════════════════════════════════════════════════════════════════════

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

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
  bg: "#f0ede8", surface: "#ffffff", card: "#ffffff", soft: "#f5f2ec", border: "#e8e0d0",
  sidebar: "#1a1a14", sidebarBorder: "rgba(201,168,76,0.2)", sidebarText: "rgba(255,255,255,0.5)",
  accent: "#c9a84c", accentLight: "#fdf8ec", accentDim: "#8a6b2a",
  gold: "#c9a84c", goldLight: "#fdf8ec", success: "#10b981", successLight: "#ecfdf5",
  danger: "#ef4444", dangerLight: "#fef2f2", warning: "#f97316", warningLight: "#fff7ed",
  info: "#0ea5e9", purple: "#8b5cf6",
  text: "#1a1a14", muted: "#6b6560", faint: "#9a948e",
};
// ─── SEGURIDAD ────────────────────────────────────────────────────────────────
const hashPassword = async (password) => {
  const salt = crypto.randomUUID().replace(/-/g, "");
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `sha256:${salt}:${hashHex}`;
};

const verifyPassword = async (password, stored) => {
  if (!stored.startsWith("sha256:")) return password === stored;
  const [, salt, hash] = stored.split(":");
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === hash;
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
const ACCESO = {
  dashboard:  ["administrador", "supervisor"],
  mesas:      ["administrador", "supervisor", "cajero", "mesero", "cocinero"],
  tickets:    ["administrador", "supervisor", "cajero", "mesero", "cocinero"],
  cocina:     ["administrador", "supervisor", "mesero", "cocinero"],
  reservas:   ["administrador", "supervisor"],
  inventario: ["administrador", "supervisor", "mesero", "cocinero"],
  platos:     ["administrador", "supervisor", "cajero", "mesero", "cocinero"],
  mermas:     ["administrador", "supervisor"],
  caja:       ["administrador", "supervisor", "cajero"],
  reportes:   ["administrador", "supervisor"],
  ia:         ["administrador", "supervisor", "cajero", "mesero", "cocinero"],
  usuarios:   ["administrador"],
  config:     ["administrador"],
};

const tieneAcceso = (id, rol) => (ACCESO[id] || []).includes(rol);

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
  { id: "usuarios", icon: "👥", label: "Usuarios", grupo: "Sistema" },
  { id: "config", icon: "⚙️", label: "Configuración", grupo: "Sistema" },
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
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = async () => {
    if (!email.trim() || !password.trim()) return;
    setCargando(true); setError("");
    const usuarios = await db("usuarios", { filtro: `?email=eq.${encodeURIComponent(email)}&activo=eq.true` });
    if (usuarios?.length > 0) {
      const ok = await verifyPassword(password, usuarios[0].password);
      if (ok) onLogin(usuarios[0]);
      else setError("Contraseña incorrecta");
    } else setError("Usuario no encontrado o inactivo");
    setCargando(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #1a1a14 0%, #2d2a1e 50%, #1a1a14 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: 16 }}>
      <div style={{ background: C.card, borderRadius: 24, padding: "48px 40px", width: "100%", maxWidth: 400, boxShadow: "0 30px 80px rgba(0,0,0,0.3)", textAlign: "center" }}>
<div style={{ margin: "0 auto 16px", textAlign: "center" }}>
  <svg viewBox="0 0 40 40" width="80" height="80" xmlns="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg">
    <defs>
    <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f0d080"/>
      <stop offset="100%" stopColor="#c9a84c"/>
    </linearGradient>
  </defs>
  <path d="M20 4 C11.2 4 4 11.2 4 20 C4 28.8 11.2 36 20 36 C24.4 36 28.4 34.2 31.4 31.2 L28.6 28.4 C26.4 30.6 23.4 32 20 32 C13.4 32 8 26.6 8 20 C8 13.4 13.4 8 20 8 C23.4 8 26.4 9.4 28.6 11.6 L31.4 8.8 C28.4 5.8 24.4 4 20 4 Z" fill="url(#lg)"/>
  <circle cx="33" cy="20" r="3" fill="url(#lg)"/>
  <circle cx="33" cy="13" r="2" fill="url(#lg)" opacity="0.7"/>
  <circle cx="33" cy="27" r="2" fill="url(#lg)" opacity="0.7"/>
  </svg>
</div>
<h1 style={{ margin: "0 0 4px", fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: 4, fontFamily: "'Cinzel', serif" }}>CUCHARAL</h1>
<p style={{ margin: "0 0 32px", color: C.muted, fontSize: 13, letterSpacing: 2, fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic" }}>Software para restaurantes</p>
<Input label="Tu correo electrónico" type="email" placeholder="correo@restaurante.es" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && entrar()} /><Input label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && entrar()} />        {error && <div style={{ color: C.danger, fontSize: 12, marginBottom: 12 }}>⚠️ {error}</div>}
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
    const cargar = async () => {
      const hoy = new Date().toISOString().split("T")[0];
      const hace7 = new Date(Date.now() - 6 * 86400000).toISOString().split("T")[0];
      const [tickets, comandas, mesas, sesiones, platos, inventario] = await Promise.all([
        db("tickets", { filtro: `?created_at=gte.${hace7}T00:00:00&order=created_at.desc&limit=500` }),
        db("comandas", { filtro: "?order=created_at.desc&limit=50" }),
        db("mesas", { filtro: "?order=numero" }),
        db("caja_sesiones", { filtro: "?estado=eq.abierta&order=created_at.desc&limit=1" }),
        db("platos", { filtro: "?order=vendidos.desc&limit=5" }),
        db("inventario", { filtro: "?order=nombre" }),
      ]);
      setDatos({
        tickets: Array.isArray(tickets) ? tickets : [],
        comandas: Array.isArray(comandas) ? comandas : [],
        mesas: Array.isArray(mesas) ? mesas : [],
        sesion: Array.isArray(sesiones) && sesiones.length > 0 ? sesiones[0] : null,
        platos: Array.isArray(platos) ? platos : [],
        inventario: Array.isArray(inventario) ? inventario : [],
      });
    };
    cargar();
    const intervalo = setInterval(cargar, 30000);
    return () => clearInterval(intervalo);
  }, []);

  if (!datos) return <Cargando />;
  const { tickets, comandas, mesas, sesion, platos, inventario } = datos;

  const hoy = new Date().toISOString().split("T")[0];
  const ticketsHoy = tickets.filter(t => t.created_at?.startsWith(hoy));
  const ventasHoy = ticketsHoy.reduce((s, t) => s + Number(t.total || 0), 0);
  const propinasHoy = ticketsHoy.reduce((s, t) => s + Number(t.propina || 0), 0);
  const mesasOcupadas = mesas.filter(m => m.estado === "ocupada").length;
  const mesasLibres = mesas.filter(m => m.estado === "libre").length;
  const comandasActivas = comandas.filter(c => c.estado !== "entregado");
  const alertasStock = inventario.filter(i => Number(i.cantidad) <= Number(i.minimo));
  const maxV = Math.max(...platos.map(p => p.vendidos), 1);

  // Ventas por día últimos 7 días
  const ventasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("es-ES", { weekday: "short" });
    const total = tickets.filter(t => t.created_at?.startsWith(key)).reduce((s, t) => s + Number(t.total || 0), 0);
    return { label: label.charAt(0).toUpperCase() + label.slice(1, 3), total, esHoy: key === hoy };
  });
  const maxSemana = Math.max(...ventasSemana.map(v => v.total), 1);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text }}>Hola, {usuario.nombre.split(" ")[0]} 👋</h1>
        <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 14 }}>{new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} · Centro de control</p>
      </div>

      {/* KPIs principales */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <KPICard icon="💶" label="Ventas hoy" value={`€${ventasHoy.toFixed(2)}`} color={C.success} sub={`${ticketsHoy.length} tickets`} />
        <KPICard icon="🤝" label="Propinas hoy" value={`€${propinasHoy.toFixed(2)}`} color={C.gold} />
        <KPICard icon="🍽️" label="Mesas ocupadas" value={`${mesasOcupadas}/${mesas.length}`} color={C.accent} sub={`${mesasLibres} libres`} />
        <KPICard icon="🍳" label="Comandas activas" value={comandasActivas.length} color={comandasActivas.length > 0 ? C.warning : C.success} />
        <KPICard icon="🏦" label="Caja" value={sesion ? "Abierta" : "Cerrada"} color={sesion ? C.success : C.danger} sub={sesion ? `Desde ${sesion.hora_apertura}` : "Sin turno activo"} />
        <KPICard icon="⚠️" label="Alertas stock" value={alertasStock.length} color={alertasStock.length > 0 ? C.danger : C.success} sub={alertasStock.length > 0 ? "Requieren atención" : "Todo OK"} />
      </div>

      {/* Fila central */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Gráfica ventas semana */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
          <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 800, color: C.text }}>📊 Ventas últimos 7 días</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 110 }}>
            {ventasSemana.map((v) => (
              <div key={v.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 9, color: v.esHoy ? C.accent : C.faint, fontWeight: 700 }}>€{v.total.toFixed(0)}</div>
                <div style={{ width: "100%", borderRadius: "6px 6px 0 0", background: v.esHoy ? C.accent : C.border, height: `${Math.max((v.total / maxSemana) * 100, 3)}px`, transition: "height .5s" }} />
                <div style={{ fontSize: 11, color: v.esHoy ? C.accent : C.faint, fontWeight: v.esHoy ? 800 : 500 }}>{v.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Comandas activas */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: C.text }}>🍳 Comandas en curso</h3>
          {comandasActivas.length === 0
            ? <div style={{ textAlign: "center", padding: "30px 0", color: C.faint, fontSize: 13 }}>Sin comandas activas</div>
            : comandasActivas.slice(0, 5).map(c => {
              const mins = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 60000);
              const color = c.estado === "listo" ? C.success : mins >= 15 ? C.danger : mins >= 8 ? C.warning : C.accent;
              return (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Mesa {c.mesa} · #{c.codigo}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{c.mesero} · {(c.items || []).length} items</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color }}>{mins}'</div>
                    <div style={{ fontSize: 10, color, fontWeight: 700 }}>{c.estado === "listo" ? "LISTO" : mins >= 15 ? "URGENTE" : "EN CURSO"}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Fila inferior */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Top platos */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.text }}>🏆 Top platos</h3>
          {platos.length === 0
            ? <div style={{ textAlign: "center", padding: "20px 0", color: C.faint, fontSize: 13 }}>Sin datos aún</div>
            : platos.map((p, i) => (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{["🥇","🥈","🥉","4.","5."][i]} {p.nombre}</span>
                  <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{p.vendidos} uds.</span>
                </div>
                <div style={{ background: C.soft, borderRadius: 4, height: 5 }}>
                  <div style={{ height: "100%", borderRadius: 4, background: i === 0 ? C.gold : C.accent, width: `${(p.vendidos / maxV) * 100}%` }} />
                </div>
              </div>
            ))}
        </div>

        {/* Mesas en vivo */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: C.text }}>🗺️ Mesas en vivo</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 8 }}>
            {mesas.map(m => (
              <div key={m.id} style={{ background: m.estado === "ocupada" ? C.accentLight : C.soft, border: `2px solid ${m.estado === "ocupada" ? C.accent : C.border}`, borderRadius: 10, padding: "8px 4px", textAlign: "center" }}>
                <div style={{ fontSize: 16 }}>{m.estado === "ocupada" ? "🔴" : "🟢"}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: C.text }}>M{m.numero}</div>
                <div style={{ fontSize: 9, color: C.muted }}>{m.estado === "ocupada" ? "Ocup." : "Libre"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas stock */}
      {alertasStock.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.danger}30`, borderRadius: 16, padding: 22, marginTop: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: C.danger }}>⚠️ Alertas de stock</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {alertasStock.map(i => (
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
  const [tab, setTab] = useState("ingredientes");
  const [items, setItems] = useState(null);
  const [productos, setProductos] = useState(null);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const [platos, setPlatos] = useState([]);

  const cargar = async () => {
    const [inv, prod, pl] = await Promise.all([
      db("inventario", { filtro: "?order=nombre" }),
      db("productos_stock", { filtro: "?order=nombre" }),
      db("platos", { filtro: "?disponible=eq.true&order=nombre" }),
    ]);
    setItems(Array.isArray(inv) ? inv : []);
    setProductos(Array.isArray(prod) ? prod : []);
    setPlatos(Array.isArray(pl) ? pl : []);
  };
  useEffect(() => { cargar(); }, []);

  // ── Ingredientes CRUD ──
  const guardarIngrediente = async () => {
    const cuerpo = { nombre: form.nombre, cantidad: +form.cantidad, unidad: form.unidad, minimo: +form.minimo, categoria: form.categoria };
    if (form.id) await db("inventario", { metodo: "PATCH", filtro: `?id=eq.${form.id}`, cuerpo });
    else await db("inventario", { metodo: "POST", cuerpo });
    toast("✅ Guardado"); setModal(null); cargar();
  };
  const eliminarIngrediente = async (id) => { await db("inventario", { metodo: "DELETE", filtro: `?id=eq.${id}` }); toast("🗑️ Eliminado", C.warning); cargar(); };

  // ── Productos CRUD ──
  const guardarProducto = async () => {
    const cuerpo = { nombre: form.nombre, categoria: form.categoria || "General", stock_actual: +form.stock_actual, stock_minimo: +form.stock_minimo, unidad: form.unidad || "und", precio_coste: +form.precio_coste || 0, imagen: form.imagen || "📦" };
    if (form.id) await db("productos_stock", { metodo: "PATCH", filtro: `?id=eq.${form.id}`, cuerpo });
    else await db("productos_stock", { metodo: "POST", cuerpo });
    toast("✅ Guardado"); setModal(null); cargar();
  };
  const eliminarProducto = async (id) => { await db("productos_stock", { metodo: "DELETE", filtro: `?id=eq.${id}` }); toast("🗑️ Eliminado", C.warning); cargar(); };
  const entradaStock = async (producto, cantidad) => {
    // 1. Suma al stock de productos terminados
    const nuevoStock = (producto.stock_actual || 0) + cantidad;
    await db("productos_stock", { metodo: "PATCH", filtro: `?id=eq.${producto.id}`, cuerpo: { stock_actual: nuevoStock } });

    // 2. Busca si tiene receta vinculada por nombre
    const platos = await db("platos", { filtro: `?nombre=eq.${encodeURIComponent(producto.nombre)}&limit=1` });
    if (Array.isArray(platos) && platos.length > 0) {
      const receta = await db("recetas", { filtro: `?plato_id=eq.${platos[0].id}` });
      if (Array.isArray(receta) && receta.length > 0) {
        for (const r of receta) {
          const invItems = await db("inventario", { filtro: `?id=eq.${r.ingrediente_id}` });
          if (Array.isArray(invItems) && invItems.length > 0) {
            const inv = invItems[0];
            const nuevaCantidad = Math.max(0, (inv.cantidad || 0) - (r.cantidad * cantidad));
            await db("inventario", { metodo: "PATCH", filtro: `?id=eq.${inv.id}`, cuerpo: { cantidad: nuevaCantidad } });
          }
        }
        toast(`✅ +${cantidad} ${producto.unidad} de ${producto.nombre} · Ingredientes descontados`);
      } else {
        toast(`✅ +${cantidad} ${producto.unidad} añadidos a ${producto.nombre}`);
      }
    } else {
      toast(`✅ +${cantidad} ${producto.unidad} añadidos a ${producto.nombre}`);
    }
    cargar();
  };

  const st = (i) => i.cantidad <= 0 ? { l: "Agotado", c: C.danger } : i.cantidad <= i.minimo ? { l: "Crítico", c: C.danger } : i.cantidad <= i.minimo * 2 ? { l: "Bajo", c: C.warning } : { l: "OK", c: C.success };
  const stProd = (p) => p.stock_actual <= 0 ? { l: "Agotado", c: C.danger } : p.stock_actual <= p.stock_minimo ? { l: "Bajo", c: C.warning } : { l: "OK", c: C.success };

  if (!items || !productos) return <Cargando />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>📦 Inventario</h2>
        {puedeEditar(usuario.rol) && (
          <Btn onClick={() => {
            if (tab === "ingredientes") setForm({ nombre: "", cantidad: "", unidad: "kg", minimo: "", categoria: "Secos" });
            else setForm({ nombre: "", categoria: "General", stock_actual: "", stock_minimo: "5", unidad: "und", precio_coste: "", imagen: "📦" });
            setModal("n");
          }} icon="+">{tab === "ingredientes" ? "Añadir ingrediente" : "Añadir producto"}</Btn>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, background: C.soft, borderRadius: 12, padding: 4, marginBottom: 18, width: "fit-content" }}>
        {[{ id: "ingredientes", label: "🧂 Ingredientes" }, { id: "productos", label: "📦 Productos terminados" }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? C.accent : "transparent", color: tab === t.id ? "#fff" : C.muted,
            border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* INGREDIENTES */}
      {tab === "ingredientes" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.faint }}>Sin ingredientes registrados</div>}
          {items.map((item) => {
            const s = st(item);
            return (
              <div key={item.id} style={{ background: C.card, border: `1px solid ${item.cantidad <= item.minimo ? s.c + "40" : C.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14 }}>
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
                    {esAdmin(usuario.rol) && <Btn small variant="danger" onClick={() => eliminarIngrediente(item.id)}>✕</Btn>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PRODUCTOS TERMINADOS */}
      {tab === "productos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {productos.length === 0 && <div style={{ textAlign: "center", padding: 40, color: C.faint }}>Sin productos registrados</div>}
          {productos.map((p) => {
            const s = stProd(p);
            return (
              <div key={p.id} style={{ background: C.card, border: `2px solid ${p.stock_actual <= p.stock_minimo ? s.c + "50" : C.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 28 }}>{p.imagen}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{p.nombre}</div>
                  <div style={{ fontSize: 11, color: C.faint }}>{p.categoria} · Mín: {p.stock_minimo} {p.unidad}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: p.stock_actual <= 0 ? C.danger : p.stock_actual <= p.stock_minimo ? C.warning : C.success }}>{p.stock_actual}</div>
                  <div style={{ fontSize: 11, color: C.faint }}>{p.unidad}</div>
                </div>
                <div style={{ fontSize: 11, color: s.c, fontWeight: 700, minWidth: 50, textAlign: "center", background: s.c + "15", borderRadius: 8, padding: "4px 8px" }}>{s.l}</div>
                {puedeEditar(usuario.rol) && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <button onClick={() => {
                      const qty = parseInt(prompt(`¿Cuántas unidades añadir a ${p.nombre}?`));
                      if (!isNaN(qty) && qty > 0) entradaStock(p, qty);
                    }} style={{ background: C.successLight, border: `1px solid ${C.success}40`, color: C.success, borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Entrada</button>
                    <Btn small variant="ghost" onClick={() => { setForm({ ...p }); setModal("ep"); }}>Editar</Btn>
                    {esAdmin(usuario.rol) && <Btn small variant="danger" onClick={() => eliminarProducto(p.id)}>✕</Btn>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ingrediente */}
      {modal && (modal === "n" || modal === "e") && tab === "ingredientes" && (
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
            <Btn onClick={guardarIngrediente}>Guardar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal Producto */}
      {modal && (modal === "n" || modal === "ep") && tab === "productos" && (
        <Modal title={modal === "n" ? "Nuevo producto" : "Editar producto"} onClose={() => setModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 12 }}>
            <Input label="Emoji" value={form.imagen || "📦"} onChange={(e) => setForm({ ...form, imagen: e.target.value })} />
            {modal === "n" ? (
              <Select label="Plato de la carta" value={form.nombre || ""} onChange={(e) => {
                const plato = platos.find(p => p.nombre === e.target.value);
                setForm({ ...form, nombre: e.target.value, imagen: plato?.imagen || form.imagen || "📦" });
              }}>
                <option value="">— Selecciona un plato —</option>
                {platos.map((p) => <option key={p.id} value={p.nombre}>{p.imagen} {p.nombre}</option>)}
              </Select>
            ) : (
              <Input label="Nombre del producto" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Input label="Stock actual" type="number" value={form.stock_actual || ""} onChange={(e) => setForm({ ...form, stock_actual: e.target.value })} />
            <Input label="Stock mínimo" type="number" value={form.stock_minimo || ""} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} />
            <Select label="Unidad" value={form.unidad || "und"} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>{["und", "kg", "g", "L", "ml", "porciones"].map((u) => <option key={u}>{u}</option>)}</Select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select label="Categoría" value={form.categoria || "General"} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>{["General", "Panadería", "Repostería", "Postres", "Bebidas", "Salados"].map((c) => <option key={c}>{c}</option>)}</Select>
            <Input label="Coste unitario €" type="number" value={form.precio_coste || ""} onChange={(e) => setForm({ ...form, precio_coste: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 6 }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={guardarProducto}>Guardar</Btn>
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
  const [inventario, setInventario] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [recetaModal, setRecetaModal] = useState(null);
  const [recetaItems, setRecetaItems] = useState([]);
  const [formIng, setFormIng] = useState({ ingrediente_id: "", cantidad: "", unidad: "g" });

  const cargar = async () => {
    const [p, inv] = await Promise.all([
      db("platos", { filtro: "?order=vendidos.desc" }),
      db("inventario", { filtro: "?order=nombre" }),
    ]);
    setPlatos(p || []);
    setInventario(Array.isArray(inv) ? inv : []);
  };
  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    const cuerpo = { nombre: form.nombre, descripcion: form.descripcion, precio: +form.precio, categoria: form.categoria, imagen: form.imagen, disponible: form.disponible ?? true };
    if (form.id) await db("platos", { metodo: "PATCH", filtro: `?id=eq.${form.id}`, cuerpo });
    else await db("platos", { metodo: "POST", cuerpo: { ...cuerpo, vendidos: 0 } });
    toast("✅ Guardado"); setModal(null); cargar();
  };
  const eliminar = async (id) => { await db("platos", { metodo: "DELETE", filtro: `?id=eq.${id}` }); toast("🗑️ Eliminado", C.warning); cargar(); };
  const toggle = async (p) => { await db("platos", { metodo: "PATCH", filtro: `?id=eq.${p.id}`, cuerpo: { disponible: !p.disponible } }); cargar(); };

  const cargarReceta = async (plato) => {
    const r = await db("recetas", { filtro: `?plato_id=eq.${plato.id}&order=ingrediente_nombre` });
    setRecetaItems(Array.isArray(r) ? r : []);
    setRecetaModal(plato);
  };

  const agregarIngrediente = async () => {
    const ing = inventario.find((i) => i.id === formIng.ingrediente_id);
    if (!ing || !formIng.cantidad) { toast("⚠️ Selecciona ingrediente y cantidad", C.warning); return; }
    await db("recetas", { metodo: "POST", cuerpo: {
      plato_id: recetaModal.id,
      plato_nombre: recetaModal.nombre,
      ingrediente_id: ing.id,
      ingrediente_nombre: ing.nombre,
      cantidad: +formIng.cantidad,
      unidad: formIng.unidad || ing.unidad,
    }});
    setFormIng({ ingrediente_id: "", cantidad: "", unidad: "g" });
    cargarReceta(recetaModal);
    toast("✅ Ingrediente añadido a receta");
  };

  const eliminarIngrediente = async (id) => {
    await db("recetas", { metodo: "DELETE", filtro: `?id=eq.${id}` });
    cargarReceta(recetaModal);
    toast("🗑️ Ingrediente eliminado", C.warning);
  };

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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Btn small variant="ghost" onClick={() => cargarReceta(p)}>🧪 Receta</Btn>
                {puedeEditar(usuario.rol) && (
                  <>
                    <Toggle checked={p.disponible} onChange={() => toggle(p)} />
                    <Btn small variant="ghost" onClick={() => { setForm({ ...p }); setModal("e"); }}>Editar</Btn>
                    {esAdmin(usuario.rol) && <Btn small variant="danger" onClick={() => eliminar(p.id)}>✕</Btn>}
                  </>
                )}
              </div>
            </div>
            <div style={{ background: C.soft, borderRadius: 6, height: 6 }}>
              <div style={{ height: "100%", borderRadius: 6, background: i === 0 ? C.gold : C.accent, width: `${(p.vendidos / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Modal plato */}
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

      {/* Modal receta */}
      {recetaModal && (
        <Modal title={`🧪 Receta — ${recetaModal.nombre}`} subtitle="Ingredientes por unidad producida" onClose={() => setRecetaModal(null)}>
          {/* Lista de ingredientes */}
          <div style={{ marginBottom: 16 }}>
            {recetaItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: C.faint, background: C.soft, borderRadius: 10 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🧂</div>
                <div style={{ fontSize: 13 }}>Sin ingredientes aún. Añade el primero.</div>
              </div>
            ) : recetaItems.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: C.soft, borderRadius: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 18 }}>🧂</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{r.ingrediente_nombre}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{r.cantidad} {r.unidad} por unidad</div>
                </div>
                {puedeEditar(usuario.rol) && (
                  <Btn small variant="danger" onClick={() => eliminarIngrediente(r.id)}>✕</Btn>
                )}
              </div>
            ))}
          </div>

          {/* Añadir ingrediente */}
          {puedeEditar(usuario.rol) && (
            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Añadir ingrediente</div>
              <Select label="Ingrediente" value={formIng.ingrediente_id} onChange={(e) => {
                const ing = inventario.find(i => i.id === e.target.value);
                setFormIng({ ...formIng, ingrediente_id: e.target.value, unidad: ing?.unidad || "g" });
              }}>
                <option value="">— Selecciona —</option>
                {inventario.map((i) => <option key={i.id} value={i.id}>{i.nombre} ({i.unidad})</option>)}
              </Select>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="Cantidad" type="number" value={formIng.cantidad} onChange={(e) => setFormIng({ ...formIng, cantidad: e.target.value })} />
                <Select label="Unidad" value={formIng.unidad} onChange={(e) => setFormIng({ ...formIng, unidad: e.target.value })}>
                  {["g", "kg", "ml", "L", "und", "tsp", "tbsp"].map((u) => <option key={u}>{u}</option>)}
                </Select>
              </div>
              <Btn full onClick={agregarIngrediente} icon="+">Añadir a receta</Btn>
            </div>
          )}
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
    if (form._pass && form._pass.trim() !== "") {
      cuerpo.password = await hashPassword(form._pass.trim());
    } else if (modal === "n") {
      toast("⚠️ La contraseña es obligatoria para crear un usuario", C.danger);
      return;
    }
    console.log("Guardando usuario:", cuerpo);
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
          <div style={{ position: "relative" }}>
            <Input label={modal === "n" ? "Contraseña" : "Nueva contraseña (dejar vacío para no cambiar)"} type={form._verPass ? "text" : "password"} placeholder="••••••••" value={form._pass || ""} onChange={(e) => setForm({ ...form, _pass: e.target.value })} />
            <button onClick={() => setForm({ ...form, _verPass: !form._verPass })} style={{ position: "absolute", right: 12, top: 32, background: "none", border: "none", cursor: "pointer", fontSize: 16, color: C.muted }}>{form._verPass ? "🙈" : "👁️"}</button>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={guardar} disabled={!form.nombre || !form.email || (modal === "n" && !form._pass)}>Guardar</Btn>
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

const ModuloMesas = ({ usuario, toast }) => {
  const [mesas, setMesas] = useState(null);
  const [zonaActiva, setZonaActiva] = useState("Todas");
  const [seleccionada, setSeleccionada] = useState(null);
  const [carrito, setCarrito] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [vista, setVista] = useState("operacion");
  const [dragging, setDragging] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [formMesa, setFormMesa] = useState({});

  const cargar = async () => {
    const [m, p] = await Promise.all([
      db("mesas", { filtro: "?order=numero" }),
      db("platos", { filtro: "?disponible=eq.true&order=nombre" }),
    ]);
    setMesas(m || []);
    setPlatos(p || []);
  };
  useEffect(() => { cargar(); }, []);

  const estadoCfg = {
    libre: { color: C.success, bg: C.successLight, label: "Libre" },
    ocupada: { color: C.danger, bg: C.dangerLight, label: "Ocupada" },
    reservada: { color: C.warning, bg: C.warningLight, label: "Reservada" },
  };

  const cambiarEstado = async (mesa, estado) => {
    await db("mesas", { metodo: "PATCH", filtro: `?id=eq.${mesa.id}`, cuerpo: { estado } });
    setSeleccionada((prev) => prev?.id === mesa.id ? { ...prev, estado } : prev);
    cargar();
    toast(`Mesa ${mesa.numero} · ${estadoCfg[estado].label}`, estadoCfg[estado].color);
  };

  const guardarPedido = async (mesa) => {
    const total = carrito.reduce((s, i) => s + i.precio * i.qty, 0);
    await db("mesas", { metodo: "PATCH", filtro: `?id=eq.${mesa.id}`, cuerpo: { estado: "ocupada", total } });
    const codigo = `C-${String(Math.floor(Math.random() * 900) + 100)}`;
    await db("comandas", { metodo: "POST", cuerpo: {
      codigo, mesa: mesa.numero, zona: mesa.zona, mesero: usuario.nombre,
      estado: "nuevo", items: carrito.map((i) => ({ nombre: i.nombre, qty: i.qty, nota: i.nota || "", listo: false })),
    }});
    setCarrito([]); setSeleccionada(null); cargar();
    toast(`✅ Pedido enviado a cocina · Mesa ${mesa.numero} · €${total.toFixed(2)}`);
  };

  const añadir = (plato) => {
    const existe = carrito.find((i) => i.id === plato.id);
    if (existe) setCarrito(carrito.map((i) => i.id === plato.id ? { ...i, qty: i.qty + 1 } : i));
    else setCarrito([...carrito, { ...plato, qty: 1 }]);
  };
  const quitar = (id) => setCarrito(carrito.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const actualizarNota = (id, nota) => setCarrito(carrito.map((i) => i.id === id ? { ...i, nota } : i));

  // ── Drag & Drop ──
  const handleMouseDown = (e, mesa) => {
    if (vista !== "salon") return;
    e.preventDefault();
    setDragging({ id: mesa.id, offsetX: e.clientX - (mesa.pos_x || 0), offsetY: e.clientY - (mesa.pos_y || 0) });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const newX = Math.max(0, Math.min(e.clientX - dragging.offsetX, 760));
    const newY = Math.max(0, Math.min(e.clientY - dragging.offsetY, 500));
    setMesas((prev) => prev.map((m) => m.id === dragging.id ? { ...m, pos_x: newX, pos_y: newY } : m));
  };

  const handleMouseUp = async () => {
    if (!dragging) return;
    const mesa = mesas.find((m) => m.id === dragging.id);
    if (mesa) await db("mesas", { metodo: "PATCH", filtro: `?id=eq.${mesa.id}`, cuerpo: { pos_x: mesa.pos_x, pos_y: mesa.pos_y } });
    setDragging(null);
  };

  // ── Editar mesa ──
  const guardarMesa = async () => {
    await db("mesas", { metodo: "PATCH", filtro: `?id=eq.${formMesa.id}`, cuerpo: {
      numero: +formMesa.numero, zona: formMesa.zona, capacidad: +formMesa.capacidad,
    }});
    toast("✅ Mesa actualizada"); setEditModal(null); cargar();
  };

  const nuevaMesa = async () => {
    const maxNum = Math.max(...(mesas?.map(m => m.numero) || [0]));
    await db("mesas", { metodo: "POST", cuerpo: {
      numero: maxNum + 1, zona: "Salón Principal", capacidad: 4,
      estado: "libre", total: 0, pos_x: 20, pos_y: 20,
    }});
    toast("✅ Mesa creada"); cargar();
  };

  const eliminarMesa = async (id) => {
    await db("mesas", { metodo: "DELETE", filtro: `?id=eq.${id}` });
    setEditModal(null); toast("🗑️ Mesa eliminada", C.warning); cargar();
  };

  if (!mesas) return <Cargando />;

  const zonas = ["Todas", ...new Set(mesas.map((m) => m.zona))];
  const mesasFiltradas = zonaActiva === "Todas" ? mesas : mesas.filter((m) => m.zona === zonaActiva);
  const stats = {
    libres: mesas.filter((m) => m.estado === "libre").length,
    ocupadas: mesas.filter((m) => m.estado === "ocupada").length,
    reservadas: mesas.filter((m) => m.estado === "reservada").length,
  };
  const totalCarrito = carrito.reduce((s, i) => s + i.precio * i.qty, 0);

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 130px)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Header */}
        <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { label: "Libres", val: stats.libres, color: C.success },
            { label: "Ocupadas", val: stats.ocupadas, color: C.danger },
            { label: "Reservadas", val: stats.reservadas, color: C.warning },
          ].map((s) => (
            <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "10px 16px", display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 9, height: 9, borderRadius: "50%", background: s.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{s.val} {s.label}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          {/* Tabs de vista */}
          <div style={{ display: "flex", gap: 6, background: C.soft, borderRadius: 12, padding: 4 }}>
            {[{ id: "operacion", label: "🪑 Operación" }, { id: "salon", label: "🗺️ Salón" }].map((v) => (
              <button key={v.id} onClick={() => setVista(v.id)} style={{
                background: vista === v.id ? C.accent : "transparent", color: vista === v.id ? "#fff" : C.muted,
                border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>{v.label}</button>
            ))}
          </div>
          {vista === "salon" && esAdmin(usuario.rol) && (
            <Btn onClick={nuevaMesa} icon="+">Nueva mesa</Btn>
          )}
          {vista === "operacion" && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {zonas.map((z) => (
                <button key={z} onClick={() => setZonaActiva(z)} style={{
                  background: zonaActiva === z ? C.accent : C.card, color: zonaActiva === z ? "#fff" : C.muted,
                  border: `1px solid ${zonaActiva === z ? C.accent : C.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>{z}</button>
              ))}
            </div>
          )}
        </div>

        {/* VISTA OPERACIÓN */}
        {vista === "operacion" && (
          <div style={{ flex: 1, overflowY: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 14 }}>
              {mesasFiltradas.map((mesa) => {
                const cfg = estadoCfg[mesa.estado];
                const sel = seleccionada?.id === mesa.id;
                return (
                  <div key={mesa.id} onClick={() => { setSeleccionada(sel ? null : mesa); setCarrito([]); }} style={{
                    background: sel ? C.accentLight : C.card,
                    border: `2px solid ${sel ? C.accent : cfg.color + "50"}`,
                    borderRadius: 16, padding: "18px 10px", cursor: "pointer", textAlign: "center",
                    boxShadow: sel ? `0 0 0 3px ${C.accent}15` : "0 1px 4px rgba(15,23,42,0.06)",
                    transition: "all .15s",
                  }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: sel ? C.accent : C.text, marginBottom: 6 }}>{mesa.numero}</div>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: cfg.color, fontWeight: 700, background: cfg.bg, borderRadius: 8, padding: "2px 8px" }}>
                      <span style={{ fontSize: 7 }}>●</span> {cfg.label}
                    </div>
                    <div style={{ fontSize: 10, color: C.faint, marginTop: 6 }}>{mesa.zona} · {mesa.capacidad}p</div>
                    {mesa.estado === "ocupada" && mesa.total > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: C.accent, marginTop: 4 }}>€{Number(mesa.total).toFixed(2)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VISTA SALÓN */}
        {vista === "salon" && (
          <div
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ flex: 1, background: C.soft, borderRadius: 16, border: `2px dashed ${C.border}`, position: "relative", overflow: "hidden", cursor: dragging ? "grabbing" : "default", userSelect: "none" }}
          >
            <div style={{ position: "absolute", top: 12, left: 12, fontSize: 11, color: C.faint, fontWeight: 600 }}>
              {esAdmin(usuario.rol) ? "Arrastra las mesas para reposicionarlas" : "Vista del salón"}
            </div>
            {mesas.map((mesa) => {
              const cfg = estadoCfg[mesa.estado];
              return (
                <div
                  key={mesa.id}
                  onMouseDown={(e) => esAdmin(usuario.rol) && handleMouseDown(e, mesa)}
                  style={{
                    position: "absolute",
                    left: mesa.pos_x || 20,
                    top: mesa.pos_y || 20,
                    width: 100,
                    background: C.card,
                    border: `2px solid ${cfg.color}`,
                    borderRadius: 14,
                    padding: "12px 8px",
                    textAlign: "center",
                    cursor: esAdmin(usuario.rol) ? (dragging?.id === mesa.id ? "grabbing" : "grab") : "default",
                    boxShadow: dragging?.id === mesa.id ? `0 8px 24px rgba(0,0,0,0.15)` : "0 2px 8px rgba(0,0,0,0.08)",
                    zIndex: dragging?.id === mesa.id ? 100 : 1,
                    transition: dragging?.id === mesa.id ? "none" : "box-shadow .2s",
                  }}
                >
                  <div style={{ fontSize: 20, fontWeight: 900, color: C.text }}>{mesa.numero}</div>
                  <div style={{ fontSize: 9, color: cfg.color, fontWeight: 700, marginTop: 2 }}>● {cfg.label}</div>
                  <div style={{ fontSize: 9, color: C.faint, marginTop: 2 }}>{mesa.zona}</div>
                  <div style={{ fontSize: 9, color: C.faint }}>{mesa.capacidad}p</div>
                  {mesa.estado === "ocupada" && mesa.total > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.accent, marginTop: 2 }}>€{Number(mesa.total).toFixed(2)}</div>
                  )}
                  {esAdmin(usuario.rol) && (
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => { e.stopPropagation(); setFormMesa({ ...mesa }); setEditModal(mesa); }}
                      style={{ marginTop: 6, background: C.accent, border: "none", color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: 9, fontWeight: 700, cursor: "pointer", width: "100%" }}
                    >✏️ Editar</button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Panel lateral pedido */}
      {seleccionada && vista === "operacion" && (
        <div style={{ width: 300, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, display: "flex", flexDirection: "column", flexShrink: 0, boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
          <div style={{ padding: "16px 18px 14px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.text }}>Mesa {seleccionada.numero}</h3>
              <button onClick={() => setSeleccionada(null)} style={{ background: "none", border: "none", color: C.faint, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{seleccionada.zona} · {seleccionada.capacidad} personas</div>
            <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
              {Object.entries(estadoCfg).map(([e, cfg]) => (
                <button key={e} onClick={() => cambiarEstado(seleccionada, e)} style={{
                  flex: 1, padding: "6px 4px", fontSize: 10, fontWeight: 700, borderRadius: 8, cursor: "pointer",
                  background: seleccionada.estado === e ? cfg.color : "transparent",
                  color: seleccionada.estado === e ? "#fff" : cfg.color,
                  border: `1px solid ${cfg.color}`,
                }}>{cfg.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 0 }}>
            {/* Carta - columna izquierda */}
            <div style={{ flex: 1, overflowY: "auto", padding: 14, borderRight: carrito.length > 0 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ fontSize: 11, color: C.faint, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Añadir al pedido</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {platos.map((p) => (
                  <button key={p.id} onClick={() => añadir(p)} style={{ background: C.soft, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 6px", cursor: "pointer", textAlign: "center" }}>
                    <div style={{ fontSize: 22 }}>{p.imagen}</div>
                    <div style={{ fontSize: 10, color: C.text, fontWeight: 600, marginTop: 3, lineHeight: 1.2 }}>{p.nombre}</div>
                    <div style={{ fontSize: 12, color: C.accent, fontWeight: 800, marginTop: 2 }}>€{Number(p.precio).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
            {/* Pedido actual - columna derecha */}
            {carrito.length > 0 && (
              <div style={{ width: 200, overflowY: "auto", padding: 14, background: C.accentLight, display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 11, color: C.faint, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Pedido</div>
                {carrito.map((i) => (
                  <div key={i.id} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.text, fontWeight: 600, flex: 1, marginRight: 4 }}>{i.imagen} {i.nombre}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                        <button onClick={() => quitar(i.id)} style={{ width: 20, height: 20, borderRadius: 5, border: "none", background: C.border, cursor: "pointer", fontSize: 12 }}>−</button>
                        <span style={{ fontSize: 12, fontWeight: 700, minWidth: 14, textAlign: "center" }}>{i.qty}</span>
                        <button onClick={() => añadir(i)} style={{ width: 20, height: 20, borderRadius: 5, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 12 }}>+</button>
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="📝 Nota..."
                      value={i.nota || ""}
                      onChange={(e) => actualizarNota(i.id, e.target.value)}
                      style={{
                        width: "100%", fontSize: 10, padding: "4px 6px", borderRadius: 6,
                        border: `1px solid ${i.nota ? C.warning : C.border}`,
                        background: i.nota ? C.warningLight : "#fff",
                        color: C.text, outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: "14px 16px", borderTop: `2px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Total nuevo</span>
              <span style={{ fontSize: 18, fontWeight: 900, color: C.accent }}>€{totalCarrito.toFixed(2)}</span>
            </div>
            <Btn full variant="success" disabled={carrito.length === 0} onClick={() => guardarPedido(seleccionada)} icon="🍳">Enviar a cocina</Btn>
          </div>
        </div>
      )}

      {/* Modal editar mesa */}
      {editModal && (
        <Modal title={`✏️ Editar Mesa ${editModal.numero}`} onClose={() => setEditModal(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Número" type="number" value={formMesa.numero || ""} onChange={(e) => setFormMesa({ ...formMesa, numero: e.target.value })} />
            <Input label="Capacidad (personas)" type="number" value={formMesa.capacidad || ""} onChange={(e) => setFormMesa({ ...formMesa, capacidad: e.target.value })} />
          </div>
          <Select label="Zona" value={formMesa.zona || ""} onChange={(e) => setFormMesa({ ...formMesa, zona: e.target.value })}>
            {["Salón Principal", "Terraza", "Privado", "Barra", "Interior"].map((z) => <option key={z}>{z}</option>)}
          </Select>
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 6 }}>
            <Btn variant="danger" onClick={() => eliminarMesa(editModal.id)}>🗑️ Eliminar mesa</Btn>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="secondary" onClick={() => setEditModal(null)}>Cancelar</Btn>
              <Btn onClick={guardarMesa}>Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};const ModuloTickets = ({ usuario, toast }) => {
  const [vista, setVista] = useState("nueva");
  const [platos, setPlatos] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mesaActual, setMesaActual] = useState("1");
  const [mesaInfo, setMesaInfo] = useState(null);
  const [catActiva, setCatActiva] = useState("Todos");
  const [modalCobro, setModalCobro] = useState(false);
  const [propinaPct, setPropinaPct] = useState(0);
  const [propinaManual, setPropinaManual] = useState("");
  const [productosStock, setProductosStock] = useState([]);
  const [cajaAbierta, setCajaAbierta] = useState(null); // null = aún no se sabe

  const cargar = async () => {
    const [p, t, ps, sesiones] = await Promise.all([
      db("platos", { filtro: "?disponible=eq.true&order=nombre" }),
      db("tickets", { filtro: "?order=created_at.desc&limit=50" }),
      db("productos_stock", { filtro: "?order=nombre" }),
      db("caja_sesiones", { filtro: "?estado=eq.abierta&order=created_at.desc&limit=1" }),
    ]);
    setPlatos(p || []);
    setTickets(t || []);
    setProductosStock(Array.isArray(ps) ? ps : []);
    setCajaAbierta(Array.isArray(sesiones) && sesiones.length > 0);
  };
  useEffect(() => { cargar(); }, []);

  // ── Carga la comanda activa de la mesa seleccionada ──
  useEffect(() => {
    const cargarMesa = async () => {
      if (!mesaActual) return;
      const [mesasDB, comandasDB] = await Promise.all([
        db("mesas", { filtro: `?numero=eq.${+mesaActual}` }),
        db("comandas", { filtro: `?mesa=eq.${+mesaActual}&estado=neq.entregado&order=created_at.desc&limit=1` }),
      ]);
      const mesa = Array.isArray(mesasDB) && mesasDB.length > 0 ? mesasDB[0] : null;
      setMesaInfo(mesa);
      setCarrito([]);

      // Si hay comanda activa y platos cargados, pre-llena el carrito
      if (Array.isArray(comandasDB) && comandasDB.length > 0 && platos.length > 0) {
        const items = (comandasDB[0].items || []).map((item) => {
          const plato = platos.find((p) => p.nombre === item.nombre);
          return plato ? { ...plato, qty: item.qty } : null;
        }).filter(Boolean);
        if (items.length > 0) setCarrito(items);
      }
    };
    cargarMesa();
  }, [mesaActual, platos]);

  const cats = ["Todos", ...new Set(platos.map((p) => p.categoria))];
  const platosFiltrados = catActiva === "Todos" ? platos : platos.filter((p) => p.categoria === catActiva);

  const añadir = (plato) => {
    const existe = carrito.find((i) => i.id === plato.id);
    if (existe) setCarrito(carrito.map((i) => i.id === plato.id ? { ...i, qty: i.qty + 1 } : i));
    else setCarrito([...carrito, { ...plato, qty: 1 }]);
  };
  const quitar = (id) => setCarrito(carrito.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));

  const totalCarrito = carrito.reduce((s, i) => s + Number(i.precio) * i.qty, 0);
  const montoPropina = propinaManual !== "" ? Number(propinaManual) || 0 : +(totalCarrito * (propinaPct / 100)).toFixed(2);
  const totalConPropina = +(totalCarrito + montoPropina).toFixed(2);

  const generarTicket = async (metodo) => {
    if (!cajaAbierta) {
      toast("🔒 No puedes cobrar: la caja está cerrada. Ábrela primero.", C.danger);
      setModalCobro(false);
      return;
    }
    const codigo = `TK-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    const items = carrito.map((i) => ({ nombre: i.nombre, precio: Number(i.precio), qty: i.qty }));
    const hora = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

    // 1. Genera el ticket
    await db("tickets", { metodo: "POST", cuerpo: {
      codigo, mesa: +mesaActual, zona: "Salón", mesero: usuario.nombre,
      metodo, items, total: totalConPropina, propina: montoPropina, hora,
    }});
// 2. Elimina comandas activas de la mesa
await db("comandas", { metodo: "DELETE", filtro: `?mesa=eq.${+mesaActual}` });

            // 3. Libera la mesa
    const mesasDB = await db("mesas", { filtro: `?numero=eq.${+mesaActual}` });
    if (Array.isArray(mesasDB) && mesasDB.length > 0) {
      await db("mesas", { metodo: "PATCH", filtro: `?id=eq.${mesasDB[0].id}`, cuerpo: { estado: "libre", total: 0 } });
    }

    // 4. Registra en Caja (movimiento de venta)
    const sesiones = await db("caja_sesiones", { filtro: "?estado=eq.abierta&order=created_at.desc&limit=1" });
    if (Array.isArray(sesiones) && sesiones.length > 0) {
      await db("caja_movimientos", { metodo: "POST", cuerpo: {
        sesion_id: sesiones[0].id,
        tipo: "venta",
        descripcion: `Ticket ${codigo} · Mesa ${mesaActual}${montoPropina > 0 ? ` (incl. €${montoPropina.toFixed(2)} propina)` : ""}`,
        monto: totalConPropina,
        metodo,
        hora,
      }});
    }

  // 5. Descuenta stock de productos terminados
    const stockDB = await db("productos_stock", { filtro: "?order=nombre" });
    if (Array.isArray(stockDB)) {
      for (const item of carrito) {
        const prod = stockDB.find((p) => p.nombre.toLowerCase() === item.nombre.toLowerCase());
        if (prod) {
          const nuevoStock = Math.max(0, prod.stock_actual - item.qty);
          await db("productos_stock", { metodo: "PATCH", filtro: `?id=eq.${prod.id}`, cuerpo: { stock_actual: nuevoStock } });
          if (nuevoStock === 0) {
            toast(`🔴 ${prod.nombre} agotado — reponer stock`, C.danger);
          } else if (nuevoStock <= prod.stock_minimo) {
            toast(`⚠️ Stock bajo: ${prod.nombre} — quedan ${nuevoStock} ${prod.unidad}`, C.warning);
          }
        }
      }
    }

    setCarrito([]);
    setMesaInfo(null);
    setMesaActual("");
    setModalCobro(false);
    setPropinaPct(0);
    setPropinaManual("");
    toast(`✅ Ticket ${codigo} · Cocina avisada · Mesa ${mesaActual} liberada`);
    cargar();
    setVista("historial");
  };

  const metodoPago = {
    efectivo: { icon: "💵", label: "Efectivo", color: C.gold },
    tarjeta: { icon: "💳", label: "Tarjeta", color: C.accent },
    bizum: { icon: "📱", label: "Bizum", color: C.success },
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>🧾 TPV / Tickets</h2>
        <div style={{ display: "flex", gap: 6, background: C.soft, borderRadius: 12, padding: 4 }}>
          {[{ id: "nueva", label: "🧾 Nueva venta" }, { id: "historial", label: "📋 Historial" }].map((v) => (
            <button key={v.id} onClick={() => setVista(v.id)} style={{
              background: vista === v.id ? C.accent : "transparent", color: vista === v.id ? "#fff" : C.muted,
              border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>{v.label}</button>
          ))}
        </div>
      </div>

      {vista === "nueva" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
          {/* Carta */}
          <div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 16px", marginBottom: 14, display: "flex", gap: 14, alignItems: "center", boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
              <div>
                <label style={{ fontSize: 11, color: C.faint, fontWeight: 700 }}>Mesa</label>
                <input type="number" value={mesaActual} onChange={(e) => setMesaActual(e.target.value)} min="1"
                  style={{ display: "block", width: 70, background: C.soft, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.text, fontSize: 16, fontWeight: 800, outline: "none", marginTop: 3 }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: C.faint, fontWeight: 700 }}>Mesero</label>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginTop: 5 }}>👤 {usuario.nombre}</div>
              </div>
              {/* Estado de la mesa */}
              {mesaInfo && (
                <div style={{ background: mesaInfo.estado === "ocupada" ? C.dangerLight : C.successLight, border: `1px solid ${mesaInfo.estado === "ocupada" ? C.danger : C.success}30`, borderRadius: 10, padding: "6px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: mesaInfo.estado === "ocupada" ? C.danger : C.success, textTransform: "uppercase" }}>
                    {mesaInfo.estado === "ocupada" ? "🔴 Ocupada" : "🟢 Libre"}
                  </div>
                  {mesaInfo.total > 0 && <div style={{ fontSize: 13, fontWeight: 800, color: C.text }}>€{Number(mesaInfo.total).toFixed(2)}</div>}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {cats.map((c) => (
                <button key={c} onClick={() => setCatActiva(c)} style={{
                  background: catActiva === c ? C.accent : C.card, color: catActiva === c ? "#fff" : C.muted,
                  border: `1px solid ${catActiva === c ? C.accent : C.border}`, borderRadius: 20, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                }}>{c}</button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {platosFiltrados.map((plato) => {
                const enCarrito = carrito.find((i) => i.id === plato.id);
                const prod = productosStock.find((p) => p.nombre.toLowerCase() === plato.nombre.toLowerCase());
                const agotado = prod && prod.stock_actual <= 0 && usuario.rol !== "administrador";
                const stockBajo = prod && prod.stock_actual > 0 && prod.stock_actual <= prod.stock_minimo;
                return (
                  <button key={plato.id} onClick={() => !agotado && añadir(plato)} style={{
                    background: agotado ? C.soft : enCarrito ? C.accentLight : C.card,
                    border: `2px solid ${agotado ? C.danger + "40" : enCarrito ? C.accent : C.border}`,
                    borderRadius: 14, padding: "14px 10px", cursor: agotado ? "not-allowed" : "pointer",
                    textAlign: "center", position: "relative", opacity: agotado ? 0.6 : 1,
                    boxShadow: "0 1px 4px rgba(15,23,42,0.04)",
                  }}>
                    {agotado && <div style={{ position: "absolute", top: 6, right: 6, fontSize: 9, background: C.danger, color: "#fff", borderRadius: 5, padding: "2px 5px", fontWeight: 700 }}>AGOTADO</div>}
                    {stockBajo && !agotado && <div style={{ position: "absolute", top: 6, left: 6, fontSize: 9, background: C.warning, color: "#fff", borderRadius: 5, padding: "2px 4px", fontWeight: 700 }}>⚠️ {prod.stock_actual}</div>}
                    {enCarrito && !agotado && <div style={{ position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%", background: C.accent, color: "#fff", fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{enCarrito.qty}</div>}
                    <div style={{ fontSize: 26, marginBottom: 6 }}>{plato.imagen}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: agotado ? C.faint : C.text, lineHeight: 1.3, marginBottom: 4 }}>{plato.nombre}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: agotado ? C.faint : C.accent }}>€{Number(plato.precio).toFixed(2)}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carrito */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, display: "flex", flexDirection: "column", boxShadow: "0 2px 8px rgba(15,23,42,0.05)", height: "fit-content", maxHeight: "calc(100vh - 200px)" }}>
            <div style={{ padding: "16px 18px 12px", borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>🧾 Mesa {mesaActual}</h3>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{carrito.length} productos</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", minHeight: 100 }}>
              {carrito.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 20px", color: C.faint }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🍽️</div>
                  <div style={{ fontSize: 13 }}>Selecciona productos o cambia el número de mesa</div>
                </div>
              ) : carrito.map((item) => (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 20 }}>{item.imagen}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{item.nombre}</div>
                    <div style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>€{(Number(item.precio) * item.qty).toFixed(2)}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => quitar(item.id)} style={{ width: 24, height: 24, borderRadius: 6, background: C.soft, border: `1px solid ${C.border}`, cursor: "pointer", fontSize: 14 }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 800, minWidth: 16, textAlign: "center" }}>{item.qty}</span>
                    <button onClick={() => añadir(item)} style={{ width: 24, height: 24, borderRadius: 6, background: C.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 14 }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            {carrito.length > 0 && (
              <div style={{ padding: "16px 18px", borderTop: `2px solid ${C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: C.text }}>TOTAL</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>€{totalCarrito.toFixed(2)}</span>
                </div>
                <Btn full variant={cajaAbierta ? "success" : "secondary"} disabled={!cajaAbierta} onClick={() => cajaAbierta ? setModalCobro(true) : toast("🔒 La caja está cerrada. Ábrela antes de cobrar.", C.danger)} icon={cajaAbierta ? "💳" : "🔒"}>{cajaAbierta ? "Cobrar" : "Caja cerrada"}</Btn>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* HISTORIAL */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {tickets.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: C.faint }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
              <div style={{ fontSize: 14 }}>Aún no hay tickets.</div>
            </div>
          ) : tickets.map((t) => {
            const mp = metodoPago[t.metodo] || metodoPago.efectivo;
            return (
              <div key={t.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: C.accentLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧾</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>{t.codigo}</span>
                    <span style={{ fontSize: 11, background: C.successLight, color: C.success, border: `1px solid ${C.success}30`, borderRadius: 5, padding: "1px 7px", fontWeight: 700 }}>✓ Pagado</span>
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Mesa {t.mesa} · {t.hora} · {t.mesero}</div>
                  <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>{(t.items || []).map((i) => `${i.nombre} x${i.qty}`).join(", ")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>€{Number(t.total).toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: mp.color, fontWeight: 600 }}>{mp.icon} {mp.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal cobro */}
      {modalCobro && (
        <Modal title={`💳 Cobrar mesa ${mesaActual}`} subtitle="Selecciona el método de pago" onClose={() => setModalCobro(false)}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: C.faint, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Subtotal</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.muted }}>€{totalCarrito.toFixed(2)}</div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: C.faint, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, textAlign: "center" }}>Propina</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {[0, 10, 15, 20].map((pct) => (
                <button key={pct} onClick={() => { setPropinaPct(pct); setPropinaManual(""); }} style={{
                  flex: 1, padding: "8px 4px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 800,
                  background: propinaPct === pct && propinaManual === "" ? C.accent : C.soft,
                  color: propinaPct === pct && propinaManual === "" ? "#fff" : C.muted,
                  border: `1px solid ${propinaPct === pct && propinaManual === "" ? C.accent : C.border}`,
                }}>{pct === 0 ? "Sin propina" : `${pct}%`}</button>
              ))}
            </div>
            <Input placeholder="O escribe un monto en €" type="number" value={propinaManual} onChange={(e) => { setPropinaManual(e.target.value); setPropinaPct(0); }} />
          </div>

          <div style={{ textAlign: "center", marginBottom: 24, paddingTop: 14, borderTop: `2px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.faint, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total a cobrar</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.text }}>€{totalConPropina.toFixed(2)}</div>
            {montoPropina > 0 && <div style={{ fontSize: 12, color: C.success, fontWeight: 700, marginTop: 2 }}>incluye €{montoPropina.toFixed(2)} de propina</div>}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {Object.entries(metodoPago).map(([key, m]) => (
              <button key={key} onClick={() => generarTicket(key)} style={{
                flex: 1, padding: "16px 8px", borderRadius: 12, cursor: "pointer",
                background: m.color + "12", border: `2px solid ${m.color}`, color: m.color,
                fontWeight: 800, fontSize: 13, display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontSize: 24 }}>{m.icon}</span>{m.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn variant="secondary" full onClick={() => setModalCobro(false)}>Cancelar</Btn>
          </div>
        </Modal>
      )}
      
    </div>
  );
};
const ModuloCaja = ({ usuario, toast }) => {
  const [sesion, setSesion] = useState(undefined);
  const [movimientos, setMovimientos] = useState([]);
  const [modalApertura, setModalApertura] = useState(false);
  const [modalCierre, setModalCierre] = useState(false);
  const [modalGasto, setModalGasto] = useState(false);
  const [fondoInicial, setFondoInicial] = useState("200");
  const [efectivoContado, setEfectivoContado] = useState("");
  const [formGasto, setFormGasto] = useState({ descripcion: "", monto: "" });
  const [procesando, setProcesando] = useState(false);
  const [ticketsCaja, setTicketsCaja] = useState([]);
 
  const cargar = async () => {
    const sesiones = await db("caja_sesiones", { filtro: `?estado=eq.abierta&order=created_at.desc` });
    if (Array.isArray(sesiones) && sesiones.length > 0) {
      const s = sesiones[0];
      setSesion(s);
      const [movs, tks] = await Promise.all([
        db("caja_movimientos", { filtro: `?sesion_id=eq.${s.id}&order=created_at.desc` }),
       db("tickets", { filtro: `?order=created_at.desc&limit=500` }),
       ]);
        setMovimientos(Array.isArray(movs) ? movs : []);
       setTicketsCaja(Array.isArray(tks) ? tks.filter(t => Number(t.propina) > 0) : []);
       } else {
       setSesion(null);
       setMovimientos([]);
       setTicketsCaja([]);
    }
  };
  useEffect(() => { cargar(); }, []);
 
  const ventas = movimientos.filter((m) => m.tipo === "venta");
  const gastos = movimientos.filter((m) => m.tipo === "gasto");
  const totalEfectivo = ventas.filter((m) => m.metodo === "efectivo").reduce((s, m) => s + Number(m.monto), 0);
  const totalTarjeta = ventas.filter((m) => m.metodo === "tarjeta").reduce((s, m) => s + Number(m.monto), 0);
  const totalGastos = Math.abs(gastos.reduce((s, m) => s + Number(m.monto), 0));
  const totalVentas = totalEfectivo + totalTarjeta;
  const fondoIni = sesion ? Number(sesion.fondo_inicial) : 0;
  const totalEsperado = fondoIni + totalEfectivo - totalGastos;
 
  const abrirCaja = async () => {
    setProcesando(true);
    const horaApertura = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const res = await db("caja_sesiones", { metodo: "POST", cuerpo: {
      estado: "abierta", fondo_inicial: +fondoInicial, cajero: usuario.nombre, hora_apertura: horaApertura,
    }});
 
    // Si Supabase devolvió la sesión creada, la usamos directo (sin esperar recarga)
    const sesionCreada = Array.isArray(res) && res.length > 0 ? res[0] : null;
 
    if (sesionCreada) {
      await db("caja_movimientos", { metodo: "POST", cuerpo: {
        sesion_id: sesionCreada.id, tipo: "apertura",
        descripcion: `Apertura de caja — ${usuario.nombre}`, monto: +fondoInicial, metodo: "efectivo", hora: horaApertura,
      }});
      // Actualizamos el estado directamente
      setSesion(sesionCreada);
      setMovimientos([{ id: "tmp", tipo: "apertura", descripcion: `Apertura de caja — ${usuario.nombre}`, monto: +fondoInicial, metodo: "efectivo", hora: horaApertura }]);
      setModalApertura(false);
      toast("🔓 Caja abierta correctamente");
      // Recargamos para sincronizar con la base de datos
      setTimeout(() => cargar(), 500);
    } else {
      // Si no devolvió datos, recargamos para buscarla
      setModalApertura(false);
      toast("🔓 Caja abierta");
      await cargar();
    }
    setProcesando(false);
  };
 
  const registrarGasto = async () => {
    await db("caja_movimientos", { metodo: "POST", cuerpo: {
      sesion_id: sesion.id, tipo: "gasto", descripcion: formGasto.descripcion,
      monto: -Math.abs(+formGasto.monto), metodo: "efectivo",
      hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }});
    setFormGasto({ descripcion: "", monto: "" });
    setModalGasto(false);
    toast("📤 Gasto registrado", C.warning);
    cargar();
  };
 
  const cerrarCaja = async () => {
    console.log("Cerrando caja:", sesion?.id, "efectivo:", efectivoContado, "esperado:", totalEsperado);
    const diferencia = +efectivoContado - totalEsperado;
    await db("caja_sesiones", { metodo: "PATCH", filtro: `?id=eq.${sesion.id}`, cuerpo: {
      estado: "cerrada", hora_cierre: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      efectivo_contado: +efectivoContado, diferencia,
    }});
    setModalCierre(false);
    setEfectivoContado("");
    toast(`🔒 Caja cerrada · ${diferencia >= 0 ? "Sobrante" : "Faltante"} €${Math.abs(diferencia).toFixed(2)}`, Math.abs(diferencia) < 1 ? C.success : C.warning);
    setSesion(null);
    setMovimientos([]);
    cargar();
  };
 
  const tipoCfg = {
    apertura: { color: C.accent, bg: C.accentLight, icon: "🔓" },
    venta: { color: C.success, bg: C.successLight, icon: "💶" },
    gasto: { color: C.danger, bg: C.dangerLight, icon: "📤" },
  };
 
  if (sesion === undefined) return <Cargando />;
 
  if (!sesion) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: 48, maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 4px 20px rgba(15,23,42,0.08)" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <h2 style={{ margin: "0 0 8px", color: C.text, fontSize: 22, fontWeight: 800 }}>Caja cerrada</h2>
          <p style={{ color: C.muted, margin: "0 0 28px", fontSize: 14 }}>Abre la caja para comenzar el turno y registrar ventas</p>
          <Btn full onClick={() => setModalApertura(true)} icon="🔓">Abrir caja</Btn>
        </div>
 
        {modalApertura && (
          <Modal title="🔓 Abrir caja" subtitle="Registra el fondo inicial para comenzar" onClose={() => setModalApertura(false)}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 700 }}>Fondo inicial en caja (€)</label>
            <input type="number" value={fondoInicial} onChange={(e) => setFondoInicial(e.target.value)}
              style={{ width: "100%", background: C.soft, border: `2px solid ${C.accent}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 24, fontWeight: 800, outline: "none", boxSizing: "border-box", marginBottom: 16 }} />
            <div style={{ background: C.accentLight, borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 13, color: C.muted }}>
              Cajero: <strong style={{ color: C.text }}>{usuario.nombre}</strong> · Hora: {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" full onClick={() => setModalApertura(false)}>Cancelar</Btn>
              <Btn variant="success" full onClick={abrirCaja} disabled={procesando} icon="🔓">{procesando ? "Abriendo..." : "Abrir caja"}</Btn>
            </div>
          </Modal>
        )}
      </div>
    );
  }
 
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>💶 Caja</h2>
          <div style={{ background: C.successLight, border: `1px solid ${C.success}30`, borderRadius: 8, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.success }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.success }}>Abierta desde {sesion.hora_apertura}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" small onClick={() => setModalGasto(true)} icon="📤">Registrar gasto</Btn>
          <Btn variant="danger" onClick={() => { setEfectivoContado(totalEsperado.toFixed(2)); setModalCierre(true); }} icon="🔒">Cerrar caja</Btn>
        </div>
      </div>
 
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <KPICard icon="💶" label="Total ventas" value={`€${totalVentas.toFixed(2)}`} color={C.success} sub={`${ventas.length} ventas`} />
        <KPICard icon="💵" label="Efectivo" value={`€${totalEfectivo.toFixed(2)}`} color={C.gold} />
        <KPICard icon="💳" label="Tarjeta" value={`€${totalTarjeta.toFixed(2)}`} color={C.accent} />
        <KPICard icon="🤝" label="Propinas" value={`€${ticketsCaja.reduce((s, t) => s + Number(t.propina || 0), 0).toFixed(2)}`} color={C.gold} sub={`${ticketsCaja.filter(t => Number(t.propina) > 0).length} tickets`} />
        <KPICard icon="🏦" label="Esperado en caja" value={`€${totalEsperado.toFixed(2)}`} color={C.success} />
      </div>
 
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text }}>📋 Movimientos del turno</h3>
            <span style={{ fontSize: 12, color: C.muted }}>{movimientos.length} registros</span>
          </div>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            {movimientos.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: C.faint, fontSize: 13 }}>Aún no hay movimientos</div>
            ) : movimientos.map((m) => {
              const cfg = tipoCfg[m.tipo] || tipoCfg.venta;
              return (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{cfg.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.descripcion}</div>
                    <div style={{ fontSize: 11, color: C.faint }}>{m.hora} · {m.metodo}</div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: Number(m.monto) < 0 ? C.danger : C.success }}>
                    {Number(m.monto) < 0 ? "-" : "+"}€{Math.abs(Number(m.monto)).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
 
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 800, color: C.text }}>📊 Resumen del turno</h3>
            <div style={{ fontSize: 12, color: C.faint, marginBottom: 12 }}>👤 {sesion.cajero} · desde {sesion.hora_apertura}</div>
            {[
              { label: "Fondo inicial", val: fondoIni, color: C.muted },
              { label: "Ventas efectivo", val: totalEfectivo, color: C.success },
              { label: "Ventas tarjeta", val: totalTarjeta, color: C.accent },
              { label: "Gastos", val: -totalGastos, color: C.danger },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: 13, color: C.muted }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: r.color }}>{r.val < 0 ? "-" : ""}€{Math.abs(r.val).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0" }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Total en caja</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>€{totalEsperado.toFixed(2)}</span>
            </div>
          </div>
          <Btn full variant="danger" onClick={() => { setEfectivoContado(totalEsperado.toFixed(2)); setModalCierre(true); }} icon="🔒">Cerrar caja del día</Btn>
        </div>
      </div>
 
      {modalGasto && (
        <Modal title="📤 Registrar gasto" subtitle="Salida de efectivo de caja" onClose={() => setModalGasto(false)}>
          <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 700 }}>Descripción</label>
          <input value={formGasto.descripcion} onChange={(e) => setFormGasto({ ...formGasto, descripcion: e.target.value })} placeholder="Ej: Compra de leche"
            style={{ width: "100%", background: C.soft, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14 }} />
          <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 700 }}>Importe (€)</label>
          <input type="number" value={formGasto.monto} onChange={(e) => setFormGasto({ ...formGasto, monto: e.target.value })} placeholder="0.00"
            style={{ width: "100%", background: C.soft, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", color: C.text, fontSize: 20, fontWeight: 800, outline: "none", boxSizing: "border-box", marginBottom: 20 }} />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" full onClick={() => setModalGasto(false)}>Cancelar</Btn>
            <Btn variant="danger" full onClick={registrarGasto} disabled={!formGasto.descripcion || !formGasto.monto} icon="📤">Registrar</Btn>
          </div>
        </Modal>
      )}
 
      {modalCierre && (
        <Modal title="🔒 Cerrar caja" subtitle="Verifica los totales antes de cerrar" onClose={() => setModalCierre(false)}>
          <div style={{ background: C.soft, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            {[
              { label: "Fondo inicial", val: fondoIni },
              { label: "Ventas efectivo", val: totalEfectivo },
              { label: "Gastos", val: -totalGastos },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                <span style={{ fontSize: 13, color: C.muted }}>{r.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{r.val < 0 ? "-" : ""}€{Math.abs(r.val).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${C.border}`, marginTop: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Esperado en caja</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: C.accent }}>€{totalEsperado.toFixed(2)}</span>
            </div>
          </div>
          <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 6, fontWeight: 700 }}>Efectivo contado físicamente (€)</label>
          <input type="number" value={efectivoContado} onChange={(e) => setEfectivoContado(e.target.value)}
            style={{ width: "100%", background: C.soft, border: `2px solid ${Math.abs(+efectivoContado - totalEsperado) > 1 ? C.danger : C.success}`, borderRadius: 12, padding: "12px 14px", color: C.text, fontSize: 22, fontWeight: 800, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
          {efectivoContado && (
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 16, color: Math.abs(+efectivoContado - totalEsperado) < 1 ? C.success : (+efectivoContado - totalEsperado) > 0 ? C.success : C.danger }}>
              {Math.abs(+efectivoContado - totalEsperado) < 0.01 ? "✅ Cuadre perfecto" : (+efectivoContado - totalEsperado) > 0 ? `✅ Sobrante: €${(+efectivoContado - totalEsperado).toFixed(2)}` : `⚠️ Faltante: €${Math.abs(+efectivoContado - totalEsperado).toFixed(2)}`}
            </div>
          )}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" full onClick={() => setModalCierre(false)}>Cancelar</Btn>
            <Btn variant="danger" full onClick={cerrarCaja} icon="🔒">Cerrar caja</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
const ModuloReportes = ({ usuario, toast }) => {
  const [datos, setDatos] = useState(null);
  const [vistaReporte, setVistaReporte] = useState("resumen");
  const [periodoVentas, setPeriodoVentas] = useState("semana");

  const cargar = async () => {
    const [tickets, platos, cajas, inventario, mermas] = await Promise.all([
      db("tickets", { filtro: "?order=created_at.desc&limit=500" }),
      db("platos", { filtro: "?order=vendidos.desc" }),
      db("caja_sesiones", { filtro: "?estado=eq.cerrada&order=created_at.desc&limit=30" }),
      db("inventario", { filtro: "?order=nombre" }),
      db("mermas", { filtro: "?order=created_at.desc&limit=100" }),
    ]);
    setDatos({
      tickets: Array.isArray(tickets) ? tickets : [],
      platos: Array.isArray(platos) ? platos : [],
      cajas: Array.isArray(cajas) ? cajas : [],
      inventario: Array.isArray(inventario) ? inventario : [],
      mermas: Array.isArray(mermas) ? mermas : [],
    });
  };
  useEffect(() => { cargar(); }, []);

  if (!datos) return <Cargando />;
  const { tickets, platos, cajas, inventario, mermas } = datos;

  const totalVentas = tickets.reduce((s, t) => s + Number(t.total), 0);
  const numTickets = tickets.length;
  const ticketMedio = numTickets > 0 ? totalVentas / numTickets : 0;

  const porMetodo = ["efectivo", "tarjeta", "bizum"].map((m) => {
    const items = tickets.filter((t) => t.metodo === m);
    const valor = items.reduce((s, t) => s + Number(t.total), 0);
    return { metodo: m, valor, count: items.length };
  }).filter((m) => m.count > 0);
  const totalMetodos = porMetodo.reduce((s, m) => s + m.valor, 0) || 1;

  const conteoTickets = {};
  tickets.forEach((t) => {
    (t.items || []).forEach((i) => {
      if (!conteoTickets[i.nombre]) conteoTickets[i.nombre] = { nombre: i.nombre, qty: 0, ingresos: 0 };
      conteoTickets[i.nombre].qty += i.qty;
      conteoTickets[i.nombre].ingresos += (i.precio || 0) * i.qty;
    });
  });
  const paloteo = Object.values(conteoTickets).sort((a, b) => b.qty - a.qty);
  const totalUnidades = paloteo.reduce((s, p) => s + p.qty, 0) || 1;

  const porMesero = {};
  tickets.forEach((t) => {
    const m = t.mesero || "Sin asignar";
    if (!porMesero[m]) porMesero[m] = { mesero: m, total: 0, tickets: 0 };
    porMesero[m].total += Number(t.total);
    porMesero[m].tickets += 1;
  });
  const meseros = Object.values(porMesero).sort((a, b) => b.total - a.total);
  const maxMesero = Math.max(...meseros.map((m) => m.total), 1);

  const ahora = new Date();
  const filtrarPorPeriodo = (t) => {
    const fecha = new Date(t.created_at);
    if (periodoVentas === "hoy") return fecha.toDateString() === ahora.toDateString();
    if (periodoVentas === "semana") return (ahora - fecha) < 7 * 24 * 60 * 60 * 1000;
    if (periodoVentas === "mes") return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    return true;
  };
  const ticketsFiltrados = tickets.filter(filtrarPorPeriodo);
  const totalFiltrado = ticketsFiltrados.reduce((s, t) => s + Number(t.total), 0);

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("es-ES", { weekday: "short" });
    const valor = tickets.filter((t) => new Date(t.created_at).toDateString() === d.toDateString()).reduce((s, t) => s + Number(t.total), 0);
    return { label, valor };
  });
  const maxDia = Math.max(...ultimos7.map((d) => d.valor), 1);

  const stockBajo = inventario.filter((i) => (i.stock || 0) <= (i.stock_minimo || 0));

  const conteoMermas = {};
  mermas.forEach((m) => {
    const nombre = m.item_nombre || m.nombre || "Sin nombre";
    if (!conteoMermas[nombre]) conteoMermas[nombre] = { nombre, cantidad: 0, costo: 0 };
    conteoMermas[nombre].cantidad += Number(m.cantidad || 0);
    conteoMermas[nombre].costo += Number(m.costo_estimado || 0);
  });
  const mermasAgrupadas = Object.values(conteoMermas).sort((a, b) => b.costo - a.costo);

  const metodoCfg = {
    efectivo: { label: "Efectivo", color: C.gold, icon: "💵" },
    tarjeta: { label: "Tarjeta", color: C.accent, icon: "💳" },
    bizum: { label: "Bizum", color: C.success, icon: "📱" },
  };
  const PALETA = [C.accent, C.gold, C.success, C.purple, C.info, C.warning];

  const Donut = ({ items, total }) => {
    let acum = 0; const R = 40, CIRC = 2 * Math.PI * R;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
          <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            {items.map((it, i) => {
              const pct = (it.valor / total) * 100;
              const dash = (pct / 100) * CIRC; const off = -acum; acum += dash;
              return <circle key={i} cx="50" cy="50" r={R} fill="none" stroke={metodoCfg[it.metodo]?.color || PALETA[i % PALETA.length]} strokeWidth="14" strokeDasharray={`${dash} ${CIRC}`} strokeDashoffset={off} />;
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>€{total.toFixed(0)}</div>
            <div style={{ fontSize: 9, color: C.faint }}>total</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          {items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 4, background: metodoCfg[it.metodo]?.color || PALETA[i % PALETA.length] }} />
              <span style={{ flex: 1, fontSize: 12, color: C.text, fontWeight: 600 }}>{metodoCfg[it.metodo]?.icon} {metodoCfg[it.metodo]?.label}</span>
              <span style={{ fontSize: 12, color: C.muted }}>€{it.valor.toFixed(0)}</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: C.text, minWidth: 36, textAlign: "right" }}>{((it.valor / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: "resumen", label: "📊 Resumen" },
    { id: "paloteo", label: "🍽️ Paloteo" },
    { id: "ventas", label: "💰 Ventas" },
    { id: "meseros", label: "👤 Meseros" },
    { id: "inventario", label: "📦 Inventario" },
    { id: "propinas", label: "🤝 Propinas" },
  ];

  return (
    <div>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>📊 Reportes y análisis</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: C.muted }}>{numTickets} tickets analizados</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={cargar} icon="🔄">Actualizar</Btn>
          <Btn onClick={() => window.print()} icon="📄">Exportar PDF</Btn>
        </div>
      </div>

      <div className="no-print" style={{ display: "flex", gap: 6, background: C.soft, borderRadius: 14, padding: 5, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setVistaReporte(t.id)} style={{
            background: vistaReporte === t.id ? C.accent : "transparent",
            color: vistaReporte === t.id ? "#fff" : C.muted,
            border: "none", borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {vistaReporte === "resumen" && (
        numTickets === 0 ? (
          <div style={{ textAlign: "center", padding: 60, color: C.faint, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.muted }}>Aún no hay datos suficientes</div>
            <div style={{ fontSize: 14, marginTop: 6 }}>Genera algunos tickets en el TPV.</div>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
              <KPICard icon="💶" label="Ingresos totales" value={`€${totalVentas.toFixed(2)}`} color={C.success} />
              <KPICard icon="🧾" label="Tickets emitidos" value={numTickets} color={C.accent} />
              <KPICard icon="📊" label="Ticket medio" value={`€${ticketMedio.toFixed(2)}`} color={C.gold} />
              <KPICard icon="🍽️" label="Platos en carta" value={platos.length} color={C.purple} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 800, color: C.text }}>💳 Método de pago</h3>
                {porMetodo.length > 0 ? <Donut items={porMetodo} total={totalMetodos} /> : <div style={{ color: C.faint, fontSize: 13, textAlign: "center", padding: 20 }}>Sin datos</div>}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 800, color: C.text }}>📈 Últimos 7 días</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
                  {ultimos7.map((v, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                      <div style={{ fontSize: 9, color: C.accent, fontWeight: 700 }}>€{v.valor.toFixed(0)}</div>
                      <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: v.valor > 0 ? C.accent : C.border, height: `${(v.valor / maxDia) * 90}px`, minHeight: v.valor > 0 ? 6 : 2 }} />
                      <div style={{ fontSize: 10, color: C.faint, fontWeight: 600 }}>{v.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )
      )}

      {vistaReporte === "paloteo" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: C.text }}>🍽️ Paloteo de platos</h3>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: C.muted }}>{totalUnidades} unidades vendidas en total</p>
          {paloteo.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.faint }}>Sin datos de tickets aún</div>
          ) : paloteo.map((p, i) => {
            const pct = (p.qty / totalUnidades) * 100;
            const palitos = Math.min(p.qty, 50);
            const grupos = Math.floor(palitos / 5);
            const resto = palitos % 5;
            let tally = "";
            for (let g = 0; g < grupos; g++) tally += "𝍷 ";
            for (let r = 0; r < resto; r++) tally += "| ";
            return (
              <div key={p.nombre} style={{ marginBottom: 16, padding: 16, background: i === 0 ? C.accentLight : C.soft, borderRadius: 12, border: `1px solid ${i === 0 ? C.accent + "40" : C.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 18, minWidth: 28 }}>{["🥇", "🥈", "🥉"][i] || `${i + 1}.`}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{p.nombre}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: C.accent }}>{p.qty} uds.</div>
                    <div style={{ fontSize: 11, color: C.muted }}>€{p.ingresos.toFixed(2)} · {pct.toFixed(1)}%</div>
                  </div>
                </div>
                <div style={{ fontSize: 20, color: i === 0 ? C.accent : C.muted, fontFamily: "monospace", marginBottom: 8, letterSpacing: 2 }}>{tally}</div>
                <div style={{ background: C.card, borderRadius: 6, height: 8 }}>
                  <div style={{ height: "100%", borderRadius: 6, background: i === 0 ? C.gold : C.accent, width: `${pct}%`, transition: "width .5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {vistaReporte === "ventas" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[{ id: "hoy", label: "Hoy" }, { id: "semana", label: "Esta semana" }, { id: "mes", label: "Este mes" }, { id: "todo", label: "Todo" }].map((p) => (
              <button key={p.id} onClick={() => setPeriodoVentas(p.id)} style={{
                background: periodoVentas === p.id ? C.accent : C.card, color: periodoVentas === p.id ? "#fff" : C.muted,
                border: `1px solid ${periodoVentas === p.id ? C.accent : C.border}`, borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>{p.label}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 20 }}>
            <KPICard icon="💶" label="Ingresos período" value={`€${totalFiltrado.toFixed(2)}`} color={C.success} />
            <KPICard icon="🧾" label="Tickets período" value={ticketsFiltrados.length} color={C.accent} />
            <KPICard icon="📊" label="Ticket medio" value={`€${ticketsFiltrados.length > 0 ? (totalFiltrado / ticketsFiltrados.length).toFixed(2) : "0.00"}`} color={C.gold} />
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 800, color: C.text }}>📈 Ventas últimos 7 días</h3>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 160 }}>
              {ultimos7.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                  <div style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>€{v.valor.toFixed(0)}</div>
                  <div style={{ width: "100%", borderRadius: "6px 6px 0 0", background: v.valor > 0 ? C.accent : C.border, height: `${(v.valor / maxDia) * 130}px`, minHeight: v.valor > 0 ? 8 : 2 }} />
                  <div style={{ fontSize: 11, color: C.faint, fontWeight: 600 }}>{v.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.text }}>🧾 Tickets del período</h3>
            {ticketsFiltrados.length === 0 ? (
              <div style={{ textAlign: "center", padding: 30, color: C.faint }}>Sin tickets en este período</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                    {["Código", "Mesa", "Hora", "Mesero", "Método", "Total"].map((h, i) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: i >= 4 ? "right" : "left", fontSize: 11, color: C.faint, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ticketsFiltrados.slice(0, 20).map((t) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "10px 12px", fontSize: 12, fontWeight: 700, color: C.accent }}>{t.codigo}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: C.muted }}>Mesa {t.mesa}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: C.muted }}>{t.hora}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: C.text }}>{t.mesero}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: C.muted, textAlign: "right" }}>{metodoCfg[t.metodo]?.icon} {metodoCfg[t.metodo]?.label}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 800, color: C.success, textAlign: "right" }}>€{Number(t.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {vistaReporte === "meseros" && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 800, color: C.text }}>👤 Ventas por mesero</h3>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: C.muted }}>{meseros.length} meseros con ventas registradas</p>
          {meseros.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: C.faint }}>Sin datos aún</div>
          ) : meseros.map((m, i) => (
            <div key={m.mesero} style={{ marginBottom: 16, padding: 16, background: C.soft, borderRadius: 12, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: PALETA[i % PALETA.length] + "25", border: `2px solid ${PALETA[i % PALETA.length]}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: PALETA[i % PALETA.length] }}>
                    {m.mesero.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.mesero}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{m.tickets} tickets · Ticket medio €{(m.total / m.tickets).toFixed(2)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: PALETA[i % PALETA.length] }}>€{m.total.toFixed(2)}</div>
              </div>
              <div style={{ background: C.card, borderRadius: 6, height: 8 }}>
                <div style={{ height: "100%", borderRadius: 6, background: PALETA[i % PALETA.length], width: `${(m.total / maxMesero) * 100}%`, transition: "width .5s" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {vistaReporte === "inventario" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {stockBajo.length > 0 && (
            <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}30`, borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.danger, marginBottom: 8 }}>⚠️ {stockBajo.length} productos con stock bajo</div>
              {stockBajo.map((i) => (
                <div key={i.id} style={{ fontSize: 12, color: C.danger, marginBottom: 4 }}>• {i.nombre} — Stock: {i.stock} / Mínimo: {i.stock_minimo}</div>
              ))}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.text }}>📦 Inventario actual</h3>
              {inventario.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: C.faint }}>Sin inventario registrado</div>
              ) : inventario.map((item) => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.nombre}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{item.categoria} · {item.unidad}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: (item.stock || 0) <= (item.stock_minimo || 0) ? C.danger : C.success }}>{item.stock} {item.unidad}</div>
                    <div style={{ fontSize: 10, color: C.faint }}>Mín: {item.stock_minimo}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.text }}>🗑️ Mermas por ítem</h3>
              {mermasAgrupadas.length === 0 ? (
                <div style={{ textAlign: "center", padding: 30, color: C.faint }}>Sin mermas registradas</div>
              ) : mermasAgrupadas.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.nombre}</div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.danger }}>-€{m.costo.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{m.cantidad} uds.</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {vistaReporte === "propinas" && (() => {
        const ticketsConPropina = tickets.filter((t) => Number(t.propina) > 0);
        const totalPropinas = ticketsConPropina.reduce((s, t) => s + Number(t.propina), 0);
        const propinasPorMesero = Object.values(ticketsConPropina.reduce((acc, t) => {
          if (!acc[t.mesero]) acc[t.mesero] = { mesero: t.mesero, total: 0, count: 0 };
          acc[t.mesero].total += Number(t.propina);
          acc[t.mesero].count += 1;
          return acc;
        }, {})).sort((a, b) => b.total - a.total);
        const propinasPorMetodo = Object.values(ticketsConPropina.reduce((acc, t) => {
          const m = t.metodo || "otro";
          if (!acc[m]) acc[m] = { metodo: m, total: 0, count: 0 };
          acc[m].total += Number(t.propina);
          acc[m].count += 1;
          return acc;
        }, {})).sort((a, b) => b.total - a.total);
        return (
          <div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
              <KPICard icon="🤝" label="Total propinas" value={`€${totalPropinas.toFixed(2)}`} color={C.success} sub={`${ticketsConPropina.length} tickets`} />
              <KPICard icon="📊" label="Propina media" value={`€${ticketsConPropina.length > 0 ? (totalPropinas / ticketsConPropina.length).toFixed(2) : "0.00"}`} color={C.accent} />
              <KPICard icon="🏆" label="Mayor propina" value={`€${ticketsConPropina.length > 0 ? Math.max(...ticketsConPropina.map(t => Number(t.propina))).toFixed(2) : "0.00"}`} color={C.gold} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.text }}>👤 Por mesero</h3>
                {propinasPorMesero.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: C.faint }}>Sin propinas registradas</div>
                : propinasPorMesero.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{m.mesero}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{m.count} tickets</div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: C.success }}>€{m.total.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.text }}>💳 Por método de pago</h3>
                {propinasPorMetodo.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: C.faint }}>Sin propinas registradas</div>
                : propinasPorMetodo.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: "capitalize" }}>{m.metodo}</div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 900, color: C.accent }}>€{m.total.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{m.count} tickets</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.text }}>📋 Detalle de propinas</h3>
              {ticketsConPropina.length === 0 ? <div style={{ textAlign: "center", padding: 30, color: C.faint }}>Sin propinas registradas</div>
              : ticketsConPropina.sort((a, b) => Number(b.propina) - Number(a.propina)).map((t) => (
                <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>#{t.codigo} · Mesa {t.mesa}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{t.mesero} · {t.metodo} · {t.hora}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.success }}>+€{Number(t.propina).toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: C.faint }}>Total: €{Number(t.total).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
const ModuloReservas = ({ usuario, toast }) => {
  const [reservas, setReservas] = useState(null);
  const [fechaActiva, setFechaActiva] = useState(new Date().toISOString().split("T")[0]);
  const [modal, setModal] = useState(null);
 
  const cargar = async () => {
    const r = await db("reservas", { filtro: "?order=hora" });
    setReservas(Array.isArray(r) ? r : []);
  };
  useEffect(() => { cargar(); }, []);
 
  const FRANJAS = ["13:00", "13:30", "14:00", "14:30", "15:00", "20:00", "20:30", "21:00", "21:30", "22:00"];
 
  const estadoCfg = {
    confirmada: { color: C.success, bg: C.successLight, label: "Confirmada", icon: "✓" },
    pendiente: { color: C.warning, bg: C.warningLight, label: "Pendiente", icon: "⏳" },
    cancelada: { color: C.danger, bg: C.dangerLight, label: "Cancelada", icon: "✕" },
    sentada: { color: C.accent, bg: C.accentLight, label: "En mesa", icon: "🪑" },
  };
 
  const fechaStr = (offset = 0) => {
    const d = new Date(); d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  };
 
  const guardar = async (form) => {
    const cuerpo = {
      nombre: form.nombre, personas: +form.personas, fecha: form.fecha, hora: form.hora,
      telefono: form.telefono, mesa: +form.mesa || null, estado: form.estado, nota: form.nota || "",
    };
    if (form.id) await db("reservas", { metodo: "PATCH", filtro: `?id=eq.${form.id}`, cuerpo });
    else await db("reservas", { metodo: "POST", cuerpo });
    toast(form.id ? "✅ Reserva actualizada" : `✅ Reserva de ${form.nombre} creada`);
    setModal(null);
    cargar();
  };
 
  const cambiarEstado = async (r, estado) => {
    await db("reservas", { metodo: "PATCH", filtro: `?id=eq.${r.id}`, cuerpo: { estado } });
    toast(`Reserva ${estadoCfg[estado].label.toLowerCase()}`, estadoCfg[estado].color);
    cargar();
  };
 
  if (!reservas) return <Cargando />;
 
  const fechas = Array.from({ length: 7 }, (_, i) => fechaStr(i));
  const reservasDelDia = reservas.filter((r) => r.fecha === fechaActiva && r.estado !== "cancelada");
  const reservasOrdenadas = [...reservasDelDia].sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
  const totalPersonas = reservasDelDia.reduce((s, r) => s + r.personas, 0);
  const confirmadas = reservasDelDia.filter((r) => r.estado === "confirmada").length;
  const pendientes = reservasDelDia.filter((r) => r.estado === "pendiente").length;
  const esFechaHoy = fechaActiva === fechaStr(0);
 
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>📅 Reservas</h2>
        <Btn onClick={() => setModal({ nombre: "", personas: 2, fecha: fechaActiva, hora: "20:00", telefono: "", mesa: "", estado: "confirmada", nota: "" })} icon="+">Nueva reserva</Btn>
      </div>
 
      {/* Selector fechas */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
        {fechas.map((f, i) => {
          const activa = fechaActiva === f;
          const count = reservas.filter((r) => r.fecha === f && r.estado !== "cancelada").length;
          const d = new Date(f + "T00:00:00");
          return (
            <button key={f} onClick={() => setFechaActiva(f)} style={{
              flexShrink: 0, minWidth: 80, padding: "12px 16px", borderRadius: 14, cursor: "pointer",
              background: activa ? C.accent : C.card, border: `1px solid ${activa ? C.accent : C.border}`,
              color: activa ? "#fff" : C.text, textAlign: "center", boxShadow: activa ? `0 4px 12px ${C.accent}40` : "none",
            }}>
              <div style={{ fontSize: 11, color: activa ? "rgba(255,255,255,0.8)" : C.muted, fontWeight: 600, textTransform: "uppercase" }}>
                {i === 0 ? "Hoy" : i === 1 ? "Mañana" : d.toLocaleDateString("es-ES", { weekday: "short" })}
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, margin: "2px 0" }}>{d.getDate()}</div>
              <div style={{ fontSize: 10, color: activa ? "rgba(255,255,255,0.8)" : C.faint }}>{d.toLocaleDateString("es-ES", { month: "short" })}</div>
              {count > 0 && <div style={{ marginTop: 4, fontSize: 10, fontWeight: 800, color: activa ? "#fff" : C.accent, background: activa ? "rgba(255,255,255,0.2)" : C.accentLight, borderRadius: 10, padding: "1px 6px", display: "inline-block" }}>{count}</div>}
            </button>
          );
        })}
      </div>
 
      {/* KPIs */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <KPICard icon="📅" label="Reservas del día" value={reservasDelDia.length} color={C.accent} />
        <KPICard icon="👥" label="Comensales" value={totalPersonas} color={C.purple} />
        <KPICard icon="✓" label="Confirmadas" value={confirmadas} color={C.success} />
        <KPICard icon="⏳" label="Pendientes" value={pendientes} color={C.warning} />
      </div>
 
      {/* Timeline */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
        <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 800, color: C.text }}>
          📋 Agenda · {new Date(fechaActiva + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </h3>
 
        {reservasOrdenadas.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: C.faint }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.muted }}>No hay reservas para este día</div>
            <div style={{ marginTop: 14 }}>
              <Btn small variant="ghost" onClick={() => setModal({ nombre: "", personas: 2, fecha: fechaActiva, hora: "20:00", telefono: "", mesa: "", estado: "confirmada", nota: "" })} icon="+">Crear la primera</Btn>
            </div>
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", left: 54, top: 12, bottom: 12, width: 2, background: C.border }} />
            {reservasOrdenadas.map((r) => {
              const cfg = estadoCfg[r.estado] || estadoCfg.confirmada;
              return (
                <div key={r.id} style={{ display: "flex", gap: 16, marginBottom: 16, position: "relative" }}>
                  <div style={{ width: 44, flexShrink: 0, textAlign: "right", paddingTop: 14 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{r.hora}</div>
                  </div>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: cfg.color, border: `3px solid ${C.card}`, boxShadow: `0 0 0 2px ${cfg.color}`, flexShrink: 0, marginTop: 16, zIndex: 1 }} />
                  <div style={{ flex: 1, background: C.soft, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", borderLeft: `3px solid ${cfg.color}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>{r.nombre}</span>
                          <span style={{ fontSize: 11, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`, borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>{cfg.icon} {cfg.label}</span>
                        </div>
                        <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, color: C.muted }}>👥 {r.personas} personas</span>
                          {r.mesa && <span style={{ fontSize: 12, color: C.muted }}>🪑 Mesa {r.mesa}</span>}
                          <span style={{ fontSize: 12, color: C.muted }}>📞 {r.telefono}</span>
                        </div>
                        {r.nota && <div style={{ fontSize: 12, color: C.gold, marginTop: 6, background: C.goldLight, borderRadius: 8, padding: "5px 10px", display: "inline-block" }}>📝 {r.nota}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.estado === "pendiente" && <Btn small variant="success" onClick={() => cambiarEstado(r, "confirmada")} icon="✓">Confirmar</Btn>}
                        {r.estado === "confirmada" && esFechaHoy && <Btn small variant="primary" onClick={() => cambiarEstado(r, "sentada")} icon="🪑">Sentar</Btn>}
                        <Btn small variant="ghost" onClick={() => setModal({ ...r, mesa: r.mesa || "" })}>Editar</Btn>
                        <Btn small variant="secondary" onClick={() => cambiarEstado(r, "cancelada")}>✕</Btn>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
 
      {/* Modal */}
      {modal && (
        <Modal title={modal.id ? "Editar reserva" : "📅 Nueva reserva"} onClose={() => setModal(null)}>
          <Input label="Nombre del cliente" value={modal.nombre} onChange={(e) => setModal({ ...modal, nombre: e.target.value })} placeholder="Ej: Familia García" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 600 }}>Personas</label>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.soft, border: `1px solid ${C.border}`, borderRadius: 10, padding: "5px 10px" }}>
                <button onClick={() => setModal({ ...modal, personas: Math.max(1, modal.personas - 1) })} style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: C.border, cursor: "pointer", fontSize: 16 }}>−</button>
                <span style={{ flex: 1, textAlign: "center", fontSize: 18, fontWeight: 800, color: C.text }}>{modal.personas}</span>
                <button onClick={() => setModal({ ...modal, personas: modal.personas + 1 })} style={{ width: 28, height: 28, borderRadius: 7, border: "none", background: C.accent, color: "#fff", cursor: "pointer", fontSize: 16 }}>+</button>
              </div>
            </div>
            <Input label="Mesa asignada" type="number" value={modal.mesa} onChange={(e) => setModal({ ...modal, mesa: e.target.value })} placeholder="Nº" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Fecha" type="date" value={modal.fecha} onChange={(e) => setModal({ ...modal, fecha: e.target.value })} />
            <Select label="Hora" value={modal.hora} onChange={(e) => setModal({ ...modal, hora: e.target.value })}>{FRANJAS.map((f) => <option key={f}>{f}</option>)}</Select>
          </div>
          <Input label="Teléfono" value={modal.telefono} onChange={(e) => setModal({ ...modal, telefono: e.target.value })} placeholder="+34 600 000 000" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 600 }}>Estado</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["confirmada", "pendiente"].map((e) => (
                <button key={e} onClick={() => setModal({ ...modal, estado: e })} style={{
                  flex: 1, padding: "9px", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 700,
                  background: modal.estado === e ? estadoCfg[e].color : C.soft,
                  color: modal.estado === e ? "#fff" : C.muted,
                  border: `1.5px solid ${modal.estado === e ? estadoCfg[e].color : C.border}`,
                }}>{estadoCfg[e].icon} {estadoCfg[e].label}</button>
              ))}
            </div>
          </div>
          <Input label="Nota (opcional)" value={modal.nota} onChange={(e) => setModal({ ...modal, nota: e.target.value })} placeholder="Cumpleaños, alergias..." />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={() => guardar(modal)} disabled={!modal.nombre?.trim() || !modal.telefono?.trim()} icon="📅">{modal.id ? "Guardar" : "Crear reserva"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
const ModuloMermas = ({ usuario, toast }) => {
  const [mermas, setMermas] = useState(null);
  const [ingredientes, setIngredientes] = useState([]);
  const [platos, setPlatos] = useState([]);
  const [modal, setModal] = useState(false);
  const [filtroMotivo, setFiltroMotivo] = useState("todos");
  const [form, setForm] = useState(null);
 
  const MOTIVOS = [
    { id: "caducado", label: "Caducado / vencido", icon: "📅", color: C.danger },
    { id: "rotura", label: "Rotura / daño", icon: "💥", color: C.warning },
    { id: "mal_estado", label: "Mal estado", icon: "🦠", color: C.danger },
    { id: "error_cocina", label: "Error de cocina", icon: "🔥", color: C.warning },
    { id: "sobrante", label: "Sobrante no usado", icon: "🗑️", color: C.muted },
    { id: "devolucion", label: "Devolución cliente", icon: "↩", color: C.info },
    { id: "robo", label: "Pérdida / robo", icon: "❓", color: C.danger },
    { id: "muestra", label: "Degustación", icon: "🎁", color: C.success },
  ];
  const motivoCfg = (id) => MOTIVOS.find((m) => m.id === id) || MOTIVOS[0];
 
  const cargar = async () => {
    const [m, inv, p] = await Promise.all([
      db("mermas", { filtro: "?order=created_at.desc" }),
      db("inventario", { filtro: "?order=nombre" }),
      db("platos", { filtro: "?order=nombre" }),
    ]);
    setMermas(Array.isArray(m) ? m : []);
    // Precio estimado por unidad: inventario no tiene precio, usamos un estimado bajo; platos sí tienen precio
    setIngredientes((inv || []).map((i) => ({ id: i.id, nombre: i.nombre, unidad: i.unidad, precioUnidad: 2.0 })));
    setPlatos((p || []).map((p) => ({ id: p.id, nombre: p.nombre, unidad: "und", precioUnidad: Number(p.precio) })));
  };
  useEffect(() => { cargar(); }, []);
 
  const abrirModal = () => {
    setForm({ tipo: "ingrediente", itemNombre: "", itemPrecio: 0, itemUnidad: "kg", cantidad: "", motivo: "", responsable: usuario.nombre, nota: "" });
    setModal(true);
  };
 
  const lista = form?.tipo === "ingrediente" ? ingredientes : platos;
  const costoEstimado = form && form.itemPrecio && form.cantidad ? form.itemPrecio * +form.cantidad : 0;
 
  const guardar = async () => {
    if (!form.itemNombre || !form.cantidad || !form.motivo) return;
    await db("mermas", { metodo: "POST", cuerpo: {
      item: form.itemNombre, tipo: form.tipo, cantidad: +form.cantidad, unidad: form.itemUnidad,
      motivo: form.motivo, costo: costoEstimado, responsable: form.responsable, nota: form.nota,
      hora: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
    }});
    toast(`🗑️ Merma registrada · -€${costoEstimado.toFixed(2)}`, C.danger);
    setModal(false);
    cargar();
  };
 
  if (!mermas) return <Cargando />;
 
  const mermasFiltradas = filtroMotivo === "todos" ? mermas : mermas.filter((m) => m.motivo === filtroMotivo);
  const totalPerdido = mermas.reduce((s, m) => s + Number(m.costo), 0);
  const hoy = new Date().toISOString().split("T")[0];
  const perdidoHoy = mermas.filter((m) => m.fecha === hoy).reduce((s, m) => s + Number(m.costo), 0);
 
  const porMotivo = MOTIVOS.map((mot) => {
    const items = mermas.filter((m) => m.motivo === mot.id);
    return { ...mot, total: items.reduce((s, m) => s + Number(m.costo), 0), count: items.length };
  }).filter((m) => m.count > 0).sort((a, b) => b.total - a.total);
  const maxMotivo = Math.max(...porMotivo.map((m) => m.total), 1);
 
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>🗑️ Control de Mermas</h2>
        <Btn variant="danger" onClick={abrirModal} icon="+">Registrar merma</Btn>
      </div>
 
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <KPICard icon="📉" label="Pérdida hoy" value={`€${perdidoHoy.toFixed(2)}`} color={C.danger} sub={`${mermas.filter((m) => m.fecha === hoy).length} registros`} />
        <KPICard icon="💸" label="Pérdida acumulada" value={`€${totalPerdido.toFixed(2)}`} color={C.warning} />
        <KPICard icon="📊" label="Promedio por merma" value={`€${mermas.length > 0 ? (totalPerdido / mermas.length).toFixed(2) : "0.00"}`} color={C.info} />
        <KPICard icon="🎯" label="Mayor causa" value={porMotivo[0]?.icon || "—"} color={C.accent} sub={porMotivo[0]?.label || "Sin datos"} />
      </div>
 
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => setFiltroMotivo("todos")} style={{ background: filtroMotivo === "todos" ? C.accent : C.card, color: filtroMotivo === "todos" ? "#fff" : C.muted, border: `1px solid ${filtroMotivo === "todos" ? C.accent : C.border}`, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Todos</button>
            {porMotivo.map((m) => (
              <button key={m.id} onClick={() => setFiltroMotivo(m.id)} style={{ background: filtroMotivo === m.id ? m.color : C.card, color: filtroMotivo === m.id ? "#fff" : C.muted, border: `1px solid ${filtroMotivo === m.id ? m.color : C.border}`, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{m.icon} {m.label}</button>
            ))}
          </div>
 
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mermasFiltradas.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: C.faint, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✨</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No hay mermas registradas</div>
              </div>
            ) : mermasFiltradas.map((m) => {
              const mot = motivoCfg(m.motivo);
              return (
                <div key={m.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 4px rgba(15,23,42,0.04)" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: mot.color + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{mot.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{m.item}</span>
                      <span style={{ fontSize: 11, background: m.tipo === "plato" ? C.accentLight : C.goldLight, color: m.tipo === "plato" ? C.accent : C.gold, border: `1px solid ${m.tipo === "plato" ? C.accent : C.gold}25`, borderRadius: 5, padding: "1px 7px", fontWeight: 600 }}>{m.tipo === "plato" ? "Plato" : "Ingrediente"}</span>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{m.cantidad} {m.unidad} · {mot.label} · {m.responsable}</div>
                    {m.nota && <div style={{ fontSize: 11, color: C.faint, marginTop: 2, fontStyle: "italic" }}>"{m.nota}"</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.danger }}>-€{Number(m.costo).toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: C.faint }}>{m.fecha} {m.hora}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
 
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(15,23,42,0.05)" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 800, color: C.text }}>📊 Pérdidas por motivo</h3>
            {porMotivo.length === 0 ? <div style={{ color: C.faint, fontSize: 13 }}>Sin datos aún</div> : porMotivo.map((m) => (
              <div key={m.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>{m.icon} {m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: m.color }}>€{m.total.toFixed(2)}</span>
                </div>
                <div style={{ background: C.soft, borderRadius: 6, height: 8 }}>
                  <div style={{ height: "100%", borderRadius: 6, background: m.color, width: `${(m.total / maxMotivo) * 100}%`, transition: "width .5s" }} />
                </div>
              </div>
            ))}
          </div>
 
          {totalPerdido > 0 && (
            <div style={{ background: C.accentLight, border: `1px solid ${C.accent}25`, borderRadius: 16, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.accent, marginBottom: 6 }}>💡 Consejo</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                Reducir las mermas un 20% recuperaría <strong style={{ color: C.text }}>€{(totalPerdido * 0.2).toFixed(2)}</strong>. Revisa los productos perecederos y ajusta las compras según la demanda real.
              </div>
            </div>
          )}
        </div>
      </div>
 
      {/* Modal registrar */}
      {modal && form && (
        <Modal title="🗑️ Registrar merma" subtitle="Registra una pérdida o desperdicio" onClose={() => setModal(false)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[{ id: "ingrediente", label: "🥚 Ingrediente" }, { id: "plato", label: "🍽️ Plato" }].map((t) => (
              <button key={t.id} onClick={() => setForm({ ...form, tipo: t.id, itemNombre: "", itemPrecio: 0 })} style={{
                flex: 1, padding: "10px", borderRadius: 12, cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: form.tipo === t.id ? C.accentLight : C.soft,
                border: `2px solid ${form.tipo === t.id ? C.accent : C.border}`,
                color: form.tipo === t.id ? C.accent : C.muted,
              }}>{t.label}</button>
            ))}
          </div>
 
          <Select label="¿Qué se mermó?" value={form.itemNombre} onChange={(e) => {
            const it = lista.find((x) => x.nombre === e.target.value);
            setForm({ ...form, itemNombre: e.target.value, itemPrecio: it?.precioUnidad || 0, itemUnidad: it?.unidad || "kg" });
          }}>
            <option value="">Selecciona...</option>
            {lista.map((i) => <option key={i.id} value={i.nombre}>{i.nombre}</option>)}
          </Select>
 
          <Input label={`Cantidad (${form.itemUnidad})`} type="number" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} placeholder="0.00" />
 
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 8, fontWeight: 600 }}>Motivo</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {MOTIVOS.map((m) => (
                <button key={m.id} onClick={() => setForm({ ...form, motivo: m.id })} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, cursor: "pointer",
                  fontSize: 12, fontWeight: 600, textAlign: "left",
                  background: form.motivo === m.id ? m.color + "15" : C.soft,
                  border: `1.5px solid ${form.motivo === m.id ? m.color : C.border}`,
                  color: form.motivo === m.id ? m.color : C.muted,
                }}><span style={{ fontSize: 16 }}>{m.icon}</span> {m.label}</button>
              ))}
            </div>
          </div>
 
          <Select label="Responsable" value={form.responsable} onChange={(e) => setForm({ ...form, responsable: e.target.value })}>
            {["David Ramírez", "María González", "Carlos Pérez", "Ana Torres"].map((n) => <option key={n}>{n}</option>)}
          </Select>
 
          <Input label="Nota (opcional)" value={form.nota} onChange={(e) => setForm({ ...form, nota: e.target.value })} placeholder="Detalles..." />
 
          {costoEstimado > 0 && (
            <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}30`, borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: C.muted }}>Pérdida estimada</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: C.danger }}>-€{costoEstimado.toFixed(2)}</div>
            </div>
          )}
 
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
            <Btn variant="danger" onClick={guardar} disabled={!form.itemNombre || !form.cantidad || !form.motivo} icon="🗑️">Registrar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};
 const ModuloCocina = ({ usuario, toast }) => {
  const [comandas, setComandas] = useState(null);
  const [filtro, setFiltro] = useState("activos");

 const cargar = async () => {
    const c = await db("comandas", { filtro: "?order=created_at" });
    setComandas(Array.isArray(c) ? c : []);
  };
  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 15000);
    return () => clearInterval(intervalo);
  }, []);
 
  const mins = (creado) => Math.floor((Date.now() - new Date(creado).getTime()) / 60000);
 
  const urgencia = (m, estado) => {
    if (estado === "listo") return { color: C.success, bg: C.successLight, label: "LISTO" };
    if (m >= 15) return { color: C.danger, bg: C.dangerLight, label: "URGENTE" };
    if (m >= 8) return { color: C.warning, bg: C.warningLight, label: "EN PREPARACIÓN" };
    return { color: C.accent, bg: C.accentLight, label: "NUEVO" };
  };
 
  const toggleItem = async (comanda, idx) => {
    const items = comanda.items.map((it, i) => i === idx ? { ...it, listo: !it.listo } : it);
    const estado = comanda.estado === "nuevo" ? "preparando" : comanda.estado;
    await db("comandas", { metodo: "PATCH", filtro: `?id=eq.${comanda.id}`, cuerpo: { items, estado } });
    cargar();
  };
 
  const marcarListo = async (comanda) => {
    await db("comandas", { metodo: "PATCH", filtro: `?id=eq.${comanda.id}`, cuerpo: { estado: "listo" } });
    toast(`🔔 Comanda ${comanda.codigo} lista`, C.success);
    cargar();
  };
 

 
  if (!comandas) return <Cargando />;
 
  const activos = comandas.filter((c) => c.estado !== "listo");
  const listos = comandas.filter((c) => c.estado === "listo");
  const urgentes = activos.filter((c) => mins(c.created_at) >= 15);
  const mostrar = filtro === "activos" ? activos : filtro === "listos" ? listos : comandas;
 
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>🍳 Cocina (KDS)</h2>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Activos", val: activos.length, color: C.accent },
              { label: "Urgentes", val: urgentes.length, color: C.danger },
              { label: "Listos", val: listos.length, color: C.success },
            ].map((s) => (
              <div key={s.label} style={{ background: C.card, border: `1px solid ${s.color}40`, borderRadius: 10, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.val}</span>
                <span style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, background: C.soft, borderRadius: 12, padding: 4 }}>
          {[{ id: "activos", label: "🔥 Activos" }, { id: "listos", label: "✓ Listos" }, { id: "todos", label: "Todos" }].map((f) => (
            <button key={f.id} onClick={() => setFiltro(f.id)} style={{
              background: filtro === f.id ? C.accent : "transparent", color: filtro === f.id ? "#fff" : C.muted,
              border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>{f.label}</button>
          ))}
        </div>
      </div>
 
      {mostrar.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: C.faint, background: C.card, borderRadius: 16, border: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.muted }}>{filtro === "activos" ? "No hay comandas pendientes" : "No hay comandas aquí"}</div>
          <div style={{ fontSize: 14, marginTop: 6 }}>Las comandas nuevas aparecen automáticamente</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16, alignItems: "start" }}>
          {[...mostrar].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((comanda) => {
            const m = mins(comanda.created_at);
            const urg = urgencia(m, comanda.estado);
            const items = comanda.items || [];
            const listosCount = items.filter((i) => i.listo).length;
            const todosListos = listosCount === items.length && items.length > 0;
 
            return (
              <div key={comanda.id} style={{
                background: C.card, border: `2px solid ${urg.color}`, borderRadius: 16, overflow: "hidden",
                display: "flex", flexDirection: "column",
                boxShadow: m >= 15 && comanda.estado !== "listo" ? `0 0 20px ${C.danger}40` : "0 2px 8px rgba(15,23,42,0.06)",
              }}>
                <div style={{ background: urg.bg, padding: "12px 16px", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: C.text }}>Mesa {comanda.mesa}</span>
                        <span style={{ fontSize: 12, color: C.muted }}>#{comanda.codigo}</span>
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{comanda.zona} · {comanda.mesero}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: urg.color, lineHeight: 1 }}>{m}'</div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: urg.color }}>{urg.label}</div>
                    </div>
                  </div>
                </div>
 
                <div style={{ padding: "8px 0", flex: 1 }}>
                  {items.map((item, i) => (
                    <div key={i} onClick={() => comanda.estado !== "listo" && toggleItem(comanda, i)} style={{
                      display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 16px",
                      cursor: comanda.estado !== "listo" ? "pointer" : "default", opacity: item.listo ? 0.5 : 1,
                      borderBottom: i < items.length - 1 ? `1px solid ${C.border}` : "none",
                    }}>
                      <div style={{ width: 24, height: 24, borderRadius: 7, flexShrink: 0, marginTop: 1, border: `2px solid ${item.listo ? C.success : C.faint}`, background: item.listo ? C.success : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#fff", fontWeight: 800 }}>{item.listo && "✓"}</div>
                      <div style={{ minWidth: 32, height: 26, borderRadius: 7, flexShrink: 0, background: C.soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: C.text }}>{item.qty}×</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, textDecoration: item.listo ? "line-through" : "none" }}>{item.nombre}</div>
                        {item.nota && <div style={{ fontSize: 13, color: C.warning, fontWeight: 600, marginTop: 2 }}>⚠️ {item.nota}</div>}
                      </div>
                    </div>
                  ))}
                </div>
 
                <div style={{ padding: "0 16px 8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                    <span>{listosCount}/{items.length} preparados</span>
                    <span>{items.length > 0 ? Math.round((listosCount / items.length) * 100) : 0}%</span>
                  </div>
                  <div style={{ background: C.soft, borderRadius: 4, height: 5 }}>
                    <div style={{ height: "100%", borderRadius: 4, background: todosListos ? C.success : urg.color, width: `${items.length > 0 ? (listosCount / items.length) * 100 : 0}%` }} />
                  </div>
                </div>
 
                <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.border}` }}>
                  {comanda.estado === "listo" ? (
                    <div style={{ width: "100%", textAlign: "center", color: C.success, fontWeight: 900, fontSize: 13, padding: "10px" }}>✓ Lista — esperando cobro en TPV</div>
                  ) : (
                    <button onClick={() => marcarListo(comanda)} disabled={!todosListos} style={{
                      width: "100%", background: todosListos ? C.success : C.soft, color: todosListos ? "#fff" : C.faint,
                      border: `1px solid ${todosListos ? C.success : C.border}`, borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 900,
                      cursor: todosListos ? "pointer" : "not-allowed",
                    }}>{todosListos ? "🔔 MARCAR LISTO" : `Faltan ${items.length - listosCount} items`}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
const useNotificaciones = (usuario) => {
  const [notis, setNotis] = useState([]);
  const vistosRef = useRef({ comandas: new Set(), stockBajo: new Set() });
  const primeraVezRef = useRef(true);

  const sonido = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch (e) {}
  };

  const agregar = (noti) => {
    setNotis((prev) => [{ id: Date.now() + Math.random(), leida: false, hora: new Date(), ...noti }, ...prev].slice(0, 30));
    sonido();
  };

  useEffect(() => {
    if (!usuario) return;
    const verificar = async () => {
      const esCocina = ["administrador", "supervisor", "cocinero"].includes(usuario.rol);
      const esMesero = ["administrador", "supervisor", "mesero"].includes(usuario.rol);
      const esStock = ["administrador", "supervisor"].includes(usuario.rol);

      const [comandas, stock] = await Promise.all([
        db("comandas", { filtro: "?order=created_at.desc&limit=30" }),
        esStock ? db("productos_stock", { filtro: "?order=nombre" }) : Promise.resolve([]),
      ]);

      if (Array.isArray(comandas)) {
        comandas.forEach((c) => {
          const yaVisto = vistosRef.current.comandas.has(c.id + "_" + c.estado);
          if (yaVisto) return;
          vistosRef.current.comandas.add(c.id + "_" + c.estado);
          if (primeraVezRef.current) return;
          if (c.estado === "nuevo" && esCocina) {
            agregar({ tipo: "cocina", icono: "🍳", titulo: `Nueva comanda · Mesa ${c.mesa}`, msg: `#${c.codigo} · ${(c.items || []).length} items` });
          }
          if (c.estado === "listo" && esMesero) {
            agregar({ tipo: "mesero", icono: "🔔", titulo: `Lista para servir · Mesa ${c.mesa}`, msg: `#${c.codigo} está lista en cocina` });
          }
        });
      }

      if (Array.isArray(stock)) {
        stock.forEach((p) => {
          const bajo = p.stock_actual <= p.stock_minimo;
          const clave = p.id;
          if (bajo && !vistosRef.current.stockBajo.has(clave)) {
            vistosRef.current.stockBajo.add(clave);
            if (!primeraVezRef.current) {
              agregar({ tipo: "stock", icono: p.stock_actual <= 0 ? "🔴" : "⚠️", titulo: p.stock_actual <= 0 ? `Agotado: ${p.nombre}` : `Stock bajo: ${p.nombre}`, msg: `Quedan ${p.stock_actual} ${p.unidad}` });
            }
          } else if (!bajo && vistosRef.current.stockBajo.has(clave)) {
            vistosRef.current.stockBajo.delete(clave);
          }
        });
      }

      primeraVezRef.current = false;
    };
    verificar();
    const intervalo = setInterval(verificar, 6000);
    return () => clearInterval(intervalo);
  }, [usuario]);

  const marcarLeidas = () => setNotis((prev) => prev.map((n) => ({ ...n, leida: true })));
  const noLeidas = notis.filter((n) => !n.leida).length;

  return { notis, noLeidas, marcarLeidas };
};

const PanelNotificaciones = ({ notis, noLeidas, marcarLeidas }) => {
  const [abierto, setAbierto] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => { setAbierto(!abierto); if (!abierto) marcarLeidas(); }} style={{ position: "relative", background: C.soft, border: `1px solid ${C.border}`, borderRadius: 8, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
        🔔
        {noLeidas > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: C.danger, color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 9, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{noLeidas}</span>}
      </button>
      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div style={{ position: "absolute", top: 44, right: 0, width: 320, maxHeight: 420, overflowY: "auto", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: "0 8px 24px rgba(15,23,42,0.15)", zIndex: 50 }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, fontSize: 13, fontWeight: 800, color: C.text }}>Notificaciones</div>
            {notis.length === 0 ? (
              <div style={{ padding: 30, textAlign: "center", color: C.faint, fontSize: 13 }}>Sin notificaciones aún</div>
            ) : notis.map((n) => (
              <div key={n.id} style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{n.icono}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{n.titulo}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{n.msg}</div>
                  <div style={{ fontSize: 10, color: C.faint, marginTop: 2 }}>{n.hora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [toast, setToast] = useState(null);

  const mostrarToast = (msg, color = C.success) => { setToast({ msg, color }); setTimeout(() => setToast(null), 3000); };
  const { notis, noLeidas, marcarLeidas } = useNotificaciones(usuario);

  if (!usuario) return <Login onLogin={setUsuario} />;

  const navVisible = NAV.filter((n) => tieneAcceso(n.id, usuario.rol));
  const grupos = [...new Set(navVisible.map((n) => n.grupo))];
  const rolActual = ROLES[usuario.rol];
  const navActual = NAV.find((n) => n.id === tab);

  const SinAcceso = () => (
    <div style={{ textAlign: "center", padding: 80, color: C.faint }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8 }}>Acceso restringido</div>
      <div style={{ fontSize: 14, color: C.muted }}>Tu rol <strong>{rolActual?.label}</strong> no tiene permisos para ver esta sección.</div>
    </div>
  );

  const render = () => {
    if (!tieneAcceso(tab, usuario.rol)) return <SinAcceso />;
    switch (tab) {
      case "dashboard": return <Dashboard usuario={usuario} />;
      case "inventario": return <ModuloInventario usuario={usuario} toast={mostrarToast} />;
      case "platos": return <ModuloPlatos usuario={usuario} toast={mostrarToast} />;
      case "usuarios": return <ModuloUsuarios usuario={usuario} toast={mostrarToast} />;
      case "config": return <ModuloConfig usuario={usuario} toast={mostrarToast} />;
      case "mesas": return <ModuloMesas usuario={usuario} toast={mostrarToast} />;
      case "tickets": return <ModuloTickets usuario={usuario} toast={mostrarToast} />;
     case "cocina": return <ModuloCocina usuario={usuario} toast={mostrarToast} />;
      case "reservas": return <ModuloReservas usuario={usuario} toast={mostrarToast} />;
      case "mermas": return <ModuloMermas usuario={usuario} toast={mostrarToast} />;
      case "caja": return <ModuloCaja usuario={usuario} toast={mostrarToast} />;
     case "reportes": return <ModuloReportes usuario={usuario} toast={mostrarToast} />;
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
         <div style={{ width: 36, height: 36, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
 <svg viewBox="0 0 40 40" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#f0d080"/>
      <stop offset="100%" stopColor="#c9a84c"/>
    </linearGradient>
  </defs>
  <path d="M20 4 C11.2 4 4 11.2 4 20 C4 28.8 11.2 36 20 36 C24.4 36 28.4 34.2 31.4 31.2 L28.6 28.4 C26.4 30.6 23.4 32 20 32 C13.4 32 8 26.6 8 20 C8 13.4 13.4 8 20 8 C23.4 8 26.4 9.4 28.6 11.6 L31.4 8.8 C28.4 5.8 24.4 4 20 4 Z" fill="url(#cg)"/>
  <circle cx="33" cy="20" r="3" fill="url(#cg)"/>
  <circle cx="33" cy="13" r="2" fill="url(#cg)" opacity="0.7"/>
  <circle cx="33" cy="27" r="2" fill="url(#cg)" opacity="0.7"/>
</svg>
</div>
{!collapsed && <div><div style={{ fontWeight: 700, fontSize: 13, color: "#c9a84c", letterSpacing: 3, fontFamily: "'Cinzel', serif" }}>CUCHARAL</div><div style={{ fontSize: 10, color: C.sidebarText }}>Software para restaurantes</div></div>}
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
          <PanelNotificaciones notis={notis} noLeidas={noLeidas} marcarLeidas={marcarLeidas} />
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