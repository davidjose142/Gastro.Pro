import { useState, useEffect } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://jwrhgseculraqouljncw.supabase.co";
const SUPABASE_KEY = "sb_publishable_sbm3BNnRCHyfUJKEcOvMUg_ndcHrcW7";

const db = async (tabla, opciones = {}) => {
  const { metodo = "GET", cuerpo, filtro = "" } = opciones;
  const url = `${SUPABASE_URL}/rest/v1/${tabla}${filtro}`;
  const res = await fetch(url, {
    method: metodo,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": metodo === "POST" ? "return=representation" : metodo === "PATCH" ? "return=representation" : "",
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (metodo === "DELETE") return true;
  const data = await res.json();
  return data;
};

// ─── PALETA AZUL MARINO Y BLANCO ─────────────────────────────────────────────
const C = {
  bg: "#f8faff",
  surface: "#f0f4ff",
  card: "#ffffff",
  border: "#dbe4f5",
  accent: "#2563eb",
  accentDim: "#1e3a8a",
  accentGlow: "rgba(37,99,235,0.08)",
  gold: "#f59e0b",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f97316",
  info: "#0ea5e9",
  text: "#0f172a",
  muted: "#475569",
  faint: "#94a3b8",
};

// ─── ROLES Y PERMISOS ─────────────────────────────────────────────────────────
const ROLES = {
  administrador: { label: "Administrador", color: C.accent, icono: "👑", permisos: ["todo"] },
  supervisor:    { label: "Supervisor",    color: C.gold,   icono: "⭐", permisos: ["ver", "editar_platos", "editar_inventario", "ver_usuarios"] },
  cajero:        { label: "Cajero",        color: C.success, icono: "💶", permisos: ["ver", "registrar_venta"] },
  cocinero:      { label: "Cocinero",      color: C.warning, icono: "👨‍🍳", permisos: ["ver", "editar_inventario"] },
  mesero:        { label: "Mesero",        color: C.info,   icono: "🍽️", permisos: ["ver"] },
};

const esAdmin = (rol) => rol === "administrador";
const puedeEditar = (rol) => ["administrador", "supervisor"].includes(rol);

// ─── USUARIO SESIÓN ───────────────────────────────────────────────────────────
const SESION_KEY = "gastropro_usuario";

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const Avatar = ({ initials, color = C.accent, size = 34 }) => (
  <div style={{
    width: size, height: size, borderRadius: size * 0.28,
    background: color + "20", border: `2px solid ${color}40`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.32, fontWeight: 800, color, flexShrink: 0,
  }}>{initials}</div>
);

const Btn = ({ children, onClick, variant = "primary", small, disabled, full }) => {
  const v = {
    primary:   { background: C.accent,         color: "#fff",    border: "none" },
    secondary: { background: "transparent",     color: C.muted,   border: `1px solid ${C.border}` },
    danger:    { background: C.danger + "12",   color: C.danger,  border: `1px solid ${C.danger}30` },
    success:   { background: C.success + "12",  color: C.success, border: `1px solid ${C.success}30` },
    ghost:     { background: "transparent",     color: C.accent,  border: `1px solid ${C.accent}40` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...v[variant], borderRadius: 10,
      padding: small ? "5px 12px" : "9px 18px",
      fontSize: small ? 12 : 13, fontWeight: 600,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1, width: full ? "100%" : "auto",
      transition: "opacity .15s",
    }}>{children}</button>
  );
};

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 600 }}>{label}</label>}
    <input {...props} style={{
      width: "100%", background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 14,
      outline: "none", boxSizing: "border-box", ...props.style,
    }} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 600 }}>{label}</label>}
    <select {...props} style={{
      width: "100%", background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 14,
      outline: "none", boxSizing: "border-box",
    }}>{children}</select>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <div onClick={onChange} style={{
    width: 40, height: 22, borderRadius: 11,
    background: checked ? C.accent : C.border,
    position: "relative", cursor: "pointer", transition: "background .2s", flexShrink: 0,
  }}>
    <div style={{
      width: 16, height: 16, borderRadius: "50%", background: "#fff",
      position: "absolute", top: 3, left: checked ? 21 : 3,
      transition: "left .2s", boxShadow: "0 1px 4px rgba(0,0,0,.2)",
    }} />
  </div>
);

const Modal = ({ title, subtitle, onClose, children, wide }) => (
  <div style={{
    position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  }} onClick={(e) => e.target === e.currentTarget && onClose()}>
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
      width: "100%", maxWidth: wide ? 680 : 480, maxHeight: "90vh", overflow: "auto",
      boxShadow: "0 20px 60px rgba(37,99,235,0.15)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        padding: "20px 24px 16px", borderBottom: `1px solid ${C.border}`,
      }}>
        <div>
          <h3 style={{ margin: 0, color: C.text, fontSize: 16, fontWeight: 700 }}>{title}</h3>
          {subtitle && <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>{subtitle}</p>}
        </div>
        <button onClick={onClose} style={{
          background: C.surface, border: `1px solid ${C.border}`, color: C.muted,
          width: 28, height: 28, borderRadius: 8, cursor: "pointer", fontSize: 13,
        }}>✕</button>
      </div>
      <div style={{ padding: 24 }}>{children}</div>
    </div>
  </div>
);

const Toast = ({ msg, color }) => (
  <div style={{
    position: "fixed", top: 20, right: 20,
    background: color + "15", border: `1px solid ${color}40`,
    borderRadius: 12, padding: "12px 20px",
    color, fontWeight: 600, fontSize: 13, zIndex: 9999,
    boxShadow: "0 4px 20px rgba(0,0,0,.1)",
  }}>{msg}</div>
);

const Cargando = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60 }}>
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
      <div style={{ color: C.muted, fontSize: 13 }}>Cargando datos...</div>
    </div>
  </div>
);

// ─── LOGIN ────────────────────────────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = async () => {
    if (!email.trim()) return;
    setCargando(true);
    setError("");
    const usuarios = await db("usuarios", { filtro: `?email=eq.${encodeURIComponent(email)}&activo=eq.true` });
    if (usuarios?.length > 0) {
      onLogin(usuarios[0]);
    } else {
      setError("Usuario no encontrado o inactivo");
    }
    setCargando(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 24,
        padding: "48px 40px", width: "100%", maxWidth: 400,
        boxShadow: "0 20px 60px rgba(37,99,235,0.1)",
        textAlign: "center",
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px",
          background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
        }}>👨‍🍳</div>
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 800, color: C.text }}>GastroPRO</h1>
        <p style={{ margin: "0 0 32px", color: C.muted, fontSize: 13 }}>Sistema de gestión hotelera</p>

        <Input
          label="Tu correo electrónico"
          type="email"
          placeholder="correo@restaurante.es"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && entrar()}
        />
        {error && <div style={{ color: C.danger, fontSize: 12, marginBottom: 12 }}>⚠️ {error}</div>}
        <Btn full onClick={entrar} disabled={cargando}>
          {cargando ? "Verificando..." : "Entrar al sistema"}
        </Btn>

        <div style={{ marginTop: 24, fontSize: 11, color: C.faint }}>
          Demo: davidjose142@gmail.com
        </div>
      </div>
    </div>
  );
};

// ─── MÓDULO: INVENTARIO ───────────────────────────────────────────────────────
const ModuloInventario = ({ usuario }) => {
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);

  const mostrarToast = (msg, color = C.success) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setCargando(true);
    const data = await db("inventario", { filtro: "?order=nombre" });
    setItems(data || []);
    setCargando(false);
  };

  const guardar = async () => {
    if (form.id) {
      await db("inventario", {
        metodo: "PATCH",
        filtro: `?id=eq.${form.id}`,
        cuerpo: { nombre: form.nombre, cantidad: +form.cantidad, unidad: form.unidad, minimo: +form.minimo, categoria: form.categoria },
      });
      mostrarToast("✅ Ingrediente actualizado");
    } else {
      await db("inventario", {
        metodo: "POST",
        cuerpo: { nombre: form.nombre, cantidad: +form.cantidad, unidad: form.unidad, minimo: +form.minimo, categoria: form.categoria },
      });
      mostrarToast("✅ Ingrediente añadido");
    }
    setModal(null);
    cargar();
  };

  const eliminar = async (id) => {
    await db("inventario", { metodo: "DELETE", filtro: `?id=eq.${id}` });
    mostrarToast("🗑️ Ingrediente eliminado", C.warning);
    cargar();
  };

  const stockStatus = (i) => {
    if (i.cantidad === 0) return { label: "Agotado", color: C.danger };
    if (i.cantidad <= i.minimo) return { label: "Crítico", color: C.danger };
    if (i.cantidad <= i.minimo * 2) return { label: "Bajo", color: C.warning };
    return { label: "OK", color: C.success };
  };

  if (cargando) return <Cargando />;

  return (
    <div>
      {toast && <Toast {...toast} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>📦 Inventario</h2>
        {puedeEditar(usuario.rol) && (
          <Btn onClick={() => { setForm({ nombre: "", cantidad: "", unidad: "kg", minimo: "", categoria: "Secos" }); setModal("nuevo"); }}>
            + Añadir ingrediente
          </Btn>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item) => {
          const st = stockStatus(item);
          return (
            <div key={item.id} style={{
              background: C.card, border: `1px solid ${item.cantidad <= item.minimo ? st.color + "30" : C.border}`,
              borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14,
              boxShadow: "0 1px 4px rgba(37,99,235,0.04)",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{item.nombre}</div>
                <div style={{ fontSize: 12, color: C.faint }}>{item.categoria}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, color: C.text, fontSize: 15 }}>
                  {item.cantidad} <span style={{ color: C.faint, fontSize: 12 }}>{item.unidad}</span>
                </div>
                <div style={{ fontSize: 11, color: st.color, fontWeight: 600 }}>{st.label}</div>
              </div>
              {puedeEditar(usuario.rol) && (
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small variant="ghost" onClick={() => { setForm({ ...item }); setModal("editar"); }}>Editar</Btn>
                  {esAdmin(usuario.rol) && <Btn small variant="danger" onClick={() => eliminar(item.id)}>✕</Btn>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal === "nuevo" ? "Nuevo ingrediente" : "Editar ingrediente"} onClose={() => setModal(null)}>
          <Input label="Nombre" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Harina de trigo" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Cantidad actual" type="number" value={form.cantidad || ""} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} />
            <Select label="Unidad" value={form.unidad || "kg"} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>
              {["kg", "g", "L", "ml", "und"].map((u) => <option key={u}>{u}</option>)}
            </Select>
          </div>
          <Input label="Stock mínimo (alerta)" type="number" value={form.minimo || ""} onChange={(e) => setForm({ ...form, minimo: e.target.value })} />
          <Select label="Categoría" value={form.categoria || "Secos"} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {["Secos", "Frescos", "Lácteos", "Repostería", "Aromas", "Condimentos", "Aceites", "Carnes", "Vegetales", "Bebidas"].map((c) => <option key={c}>{c}</option>)}
          </Select>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={guardar}>Guardar en base de datos</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── MÓDULO: PLATOS ───────────────────────────────────────────────────────────
const ModuloPlatos = ({ usuario }) => {
  const [platos, setPlatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);

  const mostrarToast = (msg, color = C.success) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    const data = await db("platos", { filtro: "?order=vendidos.desc" });
    setPlatos(data || []);
    setCargando(false);
  };

  const guardar = async () => {
    if (form.id) {
      await db("platos", {
        metodo: "PATCH",
        filtro: `?id=eq.${form.id}`,
        cuerpo: { nombre: form.nombre, descripcion: form.descripcion, precio: +form.precio, categoria: form.categoria, imagen: form.imagen, disponible: form.disponible },
      });
      mostrarToast("✅ Plato actualizado");
    } else {
      await db("platos", {
        metodo: "POST",
        cuerpo: { nombre: form.nombre, descripcion: form.descripcion, precio: +form.precio, categoria: form.categoria, imagen: form.imagen, disponible: true, vendidos: 0 },
      });
      mostrarToast("✅ Plato añadido a la carta");
    }
    setModal(null);
    cargar();
  };

  const eliminar = async (id) => {
    await db("platos", { metodo: "DELETE", filtro: `?id=eq.${id}` });
    mostrarToast("🗑️ Plato eliminado", C.warning);
    cargar();
  };

  const toggleDisponible = async (plato) => {
    await db("platos", {
      metodo: "PATCH",
      filtro: `?id=eq.${plato.id}`,
      cuerpo: { disponible: !plato.disponible },
    });
    cargar();
  };

  const max = Math.max(...platos.map((p) => p.vendidos), 1);

  if (cargando) return <Cargando />;

  return (
    <div>
      {toast && <Toast {...toast} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>🍽️ Platos & Métricas</h2>
        {puedeEditar(usuario.rol) && (
          <Btn onClick={() => { setForm({ nombre: "", descripcion: "", precio: "", categoria: "Postres", imagen: "🍽️", disponible: true }); setModal("nuevo"); }}>
            + Nuevo plato
          </Btn>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {platos.map((p, i) => (
          <div key={p.id} style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
            padding: "14px 16px", boxShadow: "0 1px 4px rgba(37,99,235,0.04)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 26 }}>{p.imagen}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{p.nombre}</span>
                  {i === 0 && <span style={{ fontSize: 10, background: C.gold + "20", color: C.gold, border: `1px solid ${C.gold}30`, borderRadius: 5, padding: "2px 7px", fontWeight: 700 }}>⭐ Top ventas</span>}
                  {!p.disponible && <span style={{ fontSize: 10, background: C.danger + "12", color: C.danger, border: `1px solid ${C.danger}25`, borderRadius: 5, padding: "2px 7px" }}>No disponible</span>}
                </div>
                <div style={{ fontSize: 12, color: C.muted }}>{p.vendidos} vendidos · €{(p.precio * p.vendidos).toFixed(2)} ingresos</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontWeight: 800, color: C.accent, fontSize: 16 }}>€{Number(p.precio).toFixed(2)}</span>
                {puedeEditar(usuario.rol) && (
                  <>
                    <Toggle checked={p.disponible} onChange={() => toggleDisponible(p)} />
                    <Btn small variant="ghost" onClick={() => { setForm({ ...p }); setModal("editar"); }}>Editar</Btn>
                    {esAdmin(usuario.rol) && <Btn small variant="danger" onClick={() => eliminar(p.id)}>✕</Btn>}
                  </>
                )}
              </div>
            </div>
            <div style={{ background: C.surface, borderRadius: 6, height: 6 }}>
              <div style={{
                height: "100%", borderRadius: 6,
                background: i === 0 ? C.gold : i === platos.length - 1 ? C.danger : C.accent,
                width: `${(p.vendidos / max) * 100}%`, transition: "width .5s",
              }} />
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === "nuevo" ? "Nuevo plato" : "Editar plato"} onClose={() => setModal(null)}>
          <Input label="Nombre del plato" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Tarta de Chocolate" />
          <Input label="Descripción" value={form.descripcion || ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción para la carta" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="Precio (€)" type="number" value={form.precio || ""} onChange={(e) => setForm({ ...form, precio: e.target.value })} />
            <Input label="Emoji / Imagen" value={form.imagen || ""} onChange={(e) => setForm({ ...form, imagen: e.target.value })} placeholder="🍽️" />
          </div>
          <Select label="Categoría" value={form.categoria || "Postres"} onChange={(e) => setForm({ ...form, categoria: e.target.value })}>
            {["Postres", "Panadería", "Repostería", "Entrantes", "Principales", "Bebidas", "Desayunos"].map((c) => <option key={c}>{c}</option>)}
          </Select>
          {modal === "editar" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: C.muted }}>Disponible en carta</span>
              <Toggle checked={form.disponible} onChange={() => setForm({ ...form, disponible: !form.disponible })} />
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={guardar}>Guardar en base de datos</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── MÓDULO: USUARIOS ─────────────────────────────────────────────────────────
const ModuloUsuarios = ({ usuario }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);

  const mostrarToast = (msg, color = C.success) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setCargando(true);
    const data = await db("usuarios", { filtro: "?order=nombre" });
    setUsuarios(data || []);
    setCargando(false);
  };

  const guardar = async () => {
    const avatar = form.nombre?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    if (form.id) {
      await db("usuarios", {
        metodo: "PATCH",
        filtro: `?id=eq.${form.id}`,
        cuerpo: { nombre: form.nombre, email: form.email, rol: form.rol, activo: form.activo, avatar },
      });
      mostrarToast("✅ Usuario actualizado");
    } else {
      await db("usuarios", {
        metodo: "POST",
        cuerpo: { nombre: form.nombre, email: form.email, rol: form.rol, activo: true, avatar },
      });
      mostrarToast("✅ Usuario creado");
    }
    setModal(null);
    cargar();
  };

  const eliminar = async (u) => {
    if (u.id === usuario.id) { mostrarToast("⚠️ No puedes eliminarte a ti mismo", C.danger); return; }
    await db("usuarios", { metodo: "DELETE", filtro: `?id=eq.${u.id}` });
    mostrarToast("🗑️ Usuario eliminado", C.warning);
    cargar();
  };

  const toggleActivo = async (u) => {
    if (u.id === usuario.id) return;
    await db("usuarios", { metodo: "PATCH", filtro: `?id=eq.${u.id}`, cuerpo: { activo: !u.activo } });
    cargar();
  };

  if (cargando) return <Cargando />;

  return (
    <div>
      {toast && <Toast {...toast} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: C.text, fontSize: 18, fontWeight: 800 }}>👥 Usuarios & Permisos</h2>
        {esAdmin(usuario.rol) && (
          <Btn onClick={() => { setForm({ nombre: "", email: "", rol: "mesero", activo: true }); setModal("nuevo"); }}>
            + Crear usuario
          </Btn>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {usuarios.map((u) => {
          const rol = ROLES[u.rol];
          const esMiCuenta = u.id === usuario.id;
          return (
            <div key={u.id} style={{
              background: C.card,
              border: `1px solid ${esMiCuenta ? C.accent + "40" : C.border}`,
              borderRadius: 14, padding: "14px 18px",
              display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
              opacity: u.activo ? 1 : 0.55,
              boxShadow: esMiCuenta ? `0 0 0 2px ${C.accent}15` : "none",
            }}>
              <Avatar initials={u.avatar} color={rol?.color || C.accent} />
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 700, color: C.text, fontSize: 14 }}>{u.nombre}</span>
                  {esMiCuenta && <span style={{ fontSize: 10, background: C.accentGlow, color: C.accent, border: `1px solid ${C.accent}30`, borderRadius: 5, padding: "2px 7px", fontWeight: 700 }}>TÚ</span>}
                </div>
                <div style={{ fontSize: 12, color: C.faint }}>{u.email}</div>
              </div>
              <span style={{
                background: (rol?.color || C.accent) + "15", color: rol?.color || C.accent,
                border: `1px solid ${(rol?.color || C.accent)}25`,
                borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700,
              }}>{rol?.icono} {rol?.label}</span>
              {esAdmin(usuario.rol) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Toggle checked={u.activo} onChange={() => toggleActivo(u)} />
                  <Btn small variant="ghost" onClick={() => { setForm({ ...u }); setModal("editar"); }}>Editar</Btn>
                  <Btn small variant="danger" onClick={() => eliminar(u)} disabled={esMiCuenta}>✕</Btn>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal
          title={modal === "nuevo" ? "Crear usuario" : "Editar usuario"}
          subtitle="Los permisos se asignan automáticamente según el rol"
          onClose={() => setModal(null)}
        >
          <Input label="Nombre completo" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre Apellido" />
          <Input label="Correo electrónico" type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@restaurante.es" />
          <Select label="Rol y permisos" value={form.rol || "mesero"} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
            {Object.entries(ROLES).map(([k, r]) => <option key={k} value={k}>{r.icono} {r.label}</option>)}
          </Select>
          <div style={{ background: C.surface, borderRadius: 10, padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.faint, fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 }}>Permisos del rol seleccionado</div>
            {form.rol === "administrador" && <div style={{ fontSize: 12, color: C.success }}>✅ Acceso total al sistema — puede editar todo y gestionar usuarios</div>}
            {form.rol === "supervisor" && <div style={{ fontSize: 12, color: C.gold }}>⭐ Puede editar platos e inventario, ver usuarios, no puede crear/eliminar usuarios</div>}
            {form.rol === "cajero" && <div style={{ fontSize: 12, color: C.success }}>💶 Puede registrar ventas y abrir/cerrar caja</div>}
            {form.rol === "cocinero" && <div style={{ fontSize: 12, color: C.warning }}>👨‍🍳 Puede ver y editar inventario solamente</div>}
            {form.rol === "mesero" && <div style={{ fontSize: 12, color: C.info }}>🍽️ Solo puede ver la carta y registrar ventas</div>}
          </div>
          {modal === "editar" && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontSize: 13, color: C.muted }}>Cuenta activa</span>
              <Toggle checked={form.activo} onChange={() => setForm({ ...form, activo: !form.activo })} />
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={guardar} disabled={!form.nombre || !form.email}>Guardar en base de datos</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── MÓDULO: CONFIGURACIÓN (solo admin) ──────────────────────────────────────
const ModuloConfiguracion = ({ usuario }) => {
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState({});
  const [toast, setToast] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const mostrarToast = (msg, color = C.success) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    const data = await db("configuracion", { filtro: "?limit=1" });
    if (data?.[0]) { setConfig(data[0]); setForm(data[0]); }
  };

  const guardar = async () => {
    setGuardando(true);
    await db("configuracion", {
      metodo: "PATCH",
      filtro: `?id=eq.${config.id}`,
      cuerpo: { nombre: form.nombre, slogan: form.slogan, telefono: form.telefono, horario: form.horario, color_acento: form.color_acento },
    });
    mostrarToast("✅ Configuración guardada");
    setGuardando(false);
    cargar();
  };

  if (!esAdmin(usuario.rol)) return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
      <div style={{ color: C.muted, fontSize: 15 }}>Solo los administradores pueden acceder a la configuración</div>
    </div>
  );

  if (!config) return <Cargando />;

  return (
    <div>
      {toast && <Toast {...toast} />}
      <h2 style={{ margin: "0 0 24px", color: C.text, fontSize: 18, fontWeight: 800 }}>⚙️ Configuración del restaurante</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(37,99,235,0.05)" }}>
          <h3 style={{ margin: "0 0 20px", color: C.text, fontSize: 14, fontWeight: 700 }}>🏪 Información del negocio</h3>
          <Input label="Nombre del restaurante / hotel" value={form.nombre || ""} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Input label="Slogan o descripción" value={form.slogan || ""} onChange={(e) => setForm({ ...form, slogan: e.target.value })} />
          <Input label="Teléfono de contacto" value={form.telefono || ""} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <Input label="Horario de atención" value={form.horario || ""} onChange={(e) => setForm({ ...form, horario: e.target.value })} placeholder="Lun–Dom 08:00–22:00" />
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, boxShadow: "0 1px 8px rgba(37,99,235,0.05)" }}>
          <h3 style={{ margin: "0 0 20px", color: C.text, fontSize: 14, fontWeight: 700 }}>🎨 Personalización visual</h3>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 600 }}>Color principal del sistema</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="color" value={form.color_acento || "#2563eb"} onChange={(e) => setForm({ ...form, color_acento: e.target.value })}
                style={{ width: 48, height: 40, borderRadius: 8, border: `1px solid ${C.border}`, cursor: "pointer", padding: 2 }} />
              <input value={form.color_acento || "#2563eb"} onChange={(e) => setForm({ ...form, color_acento: e.target.value })}
                style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "9px 12px", color: C.text, fontSize: 14, outline: "none" }} />
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 10 }}>Vista previa</div>
            <div style={{
              background: form.color_acento || C.accent,
              borderRadius: 12, padding: "16px 20px", color: "#fff", textAlign: "center",
            }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>👨‍🍳</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{form.nombre || "Tu Restaurante"}</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{form.slogan || "Tu slogan aquí"}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <Btn onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando..." : "💾 Guardar configuración"}
        </Btn>
      </div>
    </div>
  );
};

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────────────────────
const Dashboard = () => {
  const [datos, setDatos] = useState({ platos: [], inventario: [], usuarios: [] });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const [platos, inventario, usuarios] = await Promise.all([
        db("platos", { filtro: "?order=vendidos.desc" }),
        db("inventario"),
        db("usuarios"),
      ]);
      setDatos({ platos: platos || [], inventario: inventario || [], usuarios: usuarios || [] });
      setCargando(false);
    };
    cargar();
  }, []);

  if (cargando) return <Cargando />;

  const { platos, inventario, usuarios } = datos;
  const ingresos = platos.reduce((s, p) => s + p.precio * p.vendidos, 0);
  const alertas = inventario.filter((i) => i.cantidad <= i.minimo);
  const topPlato = platos[0];
  const max = Math.max(...platos.map((p) => p.vendidos), 1);

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {[
          { icon: "💶", label: "Ingresos totales", value: `€${ingresos.toFixed(0)}`, color: C.gold },
          { icon: "🏆", label: "Plato estrella", value: topPlato?.nombre || "—", color: C.success },
          { icon: "⚠️", label: "Alertas de stock", value: alertas.length, color: alertas.length > 0 ? C.danger : C.success },
          { icon: "👥", label: "Usuarios activos", value: usuarios.filter((u) => u.activo).length, color: C.accent },
        ].map((s) => (
          <div key={s.label} style={{
            flex: "1 1 150px", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 16, padding: "18px 20px", display: "flex", gap: 14, alignItems: "center",
            boxShadow: "0 2px 8px rgba(37,99,235,0.06)",
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: C.text, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Ranking platos */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(37,99,235,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 14, fontWeight: 700 }}>🏆 Ranking de ventas</h3>
          {platos.slice(0, 5).map((p, i) => (
            <div key={p.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{["🥇","🥈","🥉","4.","5."][i]} {p.nombre}</span>
                <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{p.vendidos} uds.</span>
              </div>
              <div style={{ background: C.surface, borderRadius: 4, height: 5 }}>
                <div style={{ height: "100%", borderRadius: 4, background: i === 0 ? C.gold : C.accent, width: `${(p.vendidos / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Alertas stock */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, boxShadow: "0 2px 8px rgba(37,99,235,0.06)" }}>
          <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 14, fontWeight: 700 }}>⚠️ Alertas de stock</h3>
          {alertas.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: C.success, fontSize: 13 }}>✅ Todo el inventario en orden</div>
          ) : alertas.map((i) => (
            <div key={i.id} style={{ background: C.danger + "08", border: `1px solid ${C.danger}20`, borderRadius: 10, padding: "10px 14px", marginBottom: 8 }}>
              <div style={{ fontWeight: 600, color: C.text, fontSize: 13 }}>{i.nombre}</div>
              <div style={{ fontSize: 12, color: C.danger }}>{i.cantidad} {i.unidad} — mínimo {i.minimo} {i.unidad}</div>
            </div>
          ))}

          <h3 style={{ margin: "20px 0 12px", color: C.text, fontSize: 14, fontWeight: 700 }}>👥 Equipo activo</h3>
          {usuarios.filter((u) => u.activo).slice(0, 4).map((u) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
              <Avatar initials={u.avatar} color={ROLES[u.rol]?.color || C.accent} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{u.nombre}</div>
                <div style={{ fontSize: 11, color: C.faint }}>{ROLES[u.rol]?.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard",      label: "Inicio",        icon: "🏠", adminOnly: false },
  { id: "platos",         label: "Platos",        icon: "🍽️", adminOnly: false },
  { id: "inventario",     label: "Inventario",    icon: "📦", adminOnly: false },
  { id: "usuarios",       label: "Usuarios",      icon: "👥", adminOnly: true },
  { id: "configuracion",  label: "Configuración", icon: "⚙️", adminOnly: true },
];

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [tab, setTab] = useState("dashboard");

  const cerrarSesion = () => setUsuario(null);

  if (!usuario) return <Login onLogin={setUsuario} />;

  const tabsVisibles = TABS.filter((t) => !t.adminOnly || esAdmin(usuario.rol));
  const rolActual = ROLES[usuario.rol];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', system-ui, sans-serif", color: C.text }}>
      {/* Header */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 12px rgba(37,99,235,0.07)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", gap: 14, height: 58 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>👨‍🍳</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text, lineHeight: 1 }}>GastroPRO</div>
              <div style={{ fontSize: 10, color: C.faint }}>Sistema de gestión</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <nav style={{ display: "flex", gap: 2 }}>
            {tabsVisibles.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                background: tab === t.id ? C.accentGlow : "transparent",
                color: tab === t.id ? C.accent : C.muted,
                border: `1px solid ${tab === t.id ? C.accent + "40" : "transparent"}`,
                borderRadius: 10, padding: "6px 12px", fontSize: 12, fontWeight: 600,
                cursor: "pointer", transition: "all .2s", display: "flex", alignItems: "center", gap: 5,
              }}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar initials={usuario.avatar} color={rolActual?.color || C.accent} size={30} />
            <div style={{ display: "none" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{usuario.nombre}</div>
              <div style={{ fontSize: 10, color: C.faint }}>{rolActual?.label}</div>
            </div>
            <button onClick={cerrarSesion} style={{
              background: C.surface, border: `1px solid ${C.border}`, color: C.muted,
              borderRadius: 8, padding: "5px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600,
            }}>Salir</button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>
        {tab === "dashboard"     && <Dashboard />}
        {tab === "platos"        && <ModuloPlatos usuario={usuario} />}
        {tab === "inventario"    && <ModuloInventario usuario={usuario} />}
        {tab === "usuarios"      && <ModuloUsuarios usuario={usuario} />}
        {tab === "configuracion" && <ModuloConfiguracion usuario={usuario} />}
      </div>
    </div>
  );
}