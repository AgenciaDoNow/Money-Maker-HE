/* eslint-disable */
import React, { useState, useEffect, useCallback } from "react";
import {
  loadConfig, saveConfig,
  addTransaction, deleteTransaction, subscribeTransactions,
  addProject as addProjectDB, deleteProject, subscribeProjects,
} from "./db";
import {
  MONTHS, PALETTE, CURRENCY_SYMBOLS, toMXN, fmtAmt, uid, todayStr, ownerLabel,
  DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_SRCS, DEFAULT_PROFILES,
} from "./constants";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./App.css";

// â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const sumI = (txs) => txs.filter(t => t.type === "ingreso").reduce((s, t) => s + toMXN(t.amount, t.currency), 0);
const sumE = (txs) => txs.filter(t => t.type === "gasto").reduce((s, t) => s + toMXN(t.amount, t.currency), 0);

// â”€â”€â”€ APP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function App() {
  const [config, setConfig] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("login"); // login | main | add
  const [tab, setTab] = useState("dashboard");
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [histFilter, setHistFilter] = useState("all");

  // Login state
  const [selProfile, setSelProfile] = useState(null);
  const [pin, setPin] = useState("");
  const [pinErr, setPinErr] = useState("");

  // Add form state
  const [addType, setAddType] = useState("gasto");
  const [addCat, setAddCat] = useState("");
  const [addSrc, setAddSrc] = useState("");
  const [addOwner, setAddOwner] = useState("ambos");
  const [addAmount, setAddAmount] = useState("");
  const [addCurrency, setAddCurrency] = useState("MXN");
  const [addDate, setAddDate] = useState(todayStr());
  const [addDesc, setAddDesc] = useState("");
  const [addMethod, setAddMethod] = useState("efectivo");
  const [addProject, setAddProject] = useState("");

  useEffect(() => {
    loadConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubTx = subscribeTransactions(setTransactions);
    const unsubPr = subscribeProjects(setProjects);
    return () => { unsubTx(); unsubPr(); };
  }, [user]);

  const showToast = useCallback((msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2400);
  }, []);

  // â”€â”€â”€ LOGIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleProfileSelect = (p) => {
    setSelProfile(p);
    setPin("");
    setPinErr("");
  };

  const handlePinKey = (k) => {
    if (k === "â†") { setPin(p => p.slice(0, -1)); setPinErr(""); return; }
    if (pin.length >= 4) return;
    const newPin = pin + k;
    setPin(newPin);
    if (newPin.length === 4) {
      setTimeout(() => {
        if (newPin === selProfile.pin) {
          setUser(selProfile);
          setScreen("main");
          setAddOwner(selProfile.id);
        } else {
          setPinErr("PIN incorrecto, intenta de nuevo");
          setPin("");
        }
      }, 150);
    }
  };

  // â”€â”€â”€ ADD TX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleAddTx = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return showToast("Ingresa un monto vÃ¡lido", false);
    if (addType === "gasto" && !addCat) return showToast("Selecciona una categorÃ­a", false);
    if (addType === "ingreso" && !addSrc) return showToast("Selecciona la fuente", false);
    const tx = {
      type: addType, date: addDate, amount, currency: addCurrency,
      category: addType === "gasto" ? addCat : null,
      source: addType === "ingreso" ? addSrc : null,
      description: addDesc, owner: addOwner, paymentMethod: addMethod,
      projectId: addProject || null,
      createdAt: new Date().toISOString(),
      registeredBy: user.id,
    };
    try {
      await addTransaction(tx);
      showToast("âœ“ Guardado y sincronizado");
      setAddAmount(""); setAddDesc(""); setAddCat(""); setAddSrc(""); setAddProject("");
      setScreen("main");
    } catch (e) {
      showToast("Error al guardar", false);
    }
  };

  const handleDeleteTx = async (id) => {
    try { await deleteTransaction(id); showToast("Eliminado"); }
    catch { showToast("Error al eliminar", false); }
  };

  // â”€â”€â”€ CONFIG UPDATES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const updateConfig = async (updates) => {
    const updated = { ...config, ...updates };
    setConfig(updated);
    await saveConfig(updates);
  };

  const handleAddCat = async (name, icon, color) => {
    const newCat = { id: "c_" + uid(), label: name, icon, color, custom: true };
    const updated = [...(config.expenseCats || []), newCat];
    await updateConfig({ expenseCats: updated });
    showToast("CategorÃ­a agregada");
  };

  const handleDeleteCat = async (id) => {
    const updated = (config.expenseCats || []).filter(c => c.id !== id);
    await updateConfig({ expenseCats: updated });
    showToast("CategorÃ­a eliminada");
  };

  const handleAddSrc = async (name, icon, color, owner) => {
    const newSrc = { id: "s_" + uid(), label: name, icon, color, owner, custom: true };
    const updated = [...(config.incomeSrcs || []), newSrc];
    await updateConfig({ incomeSrcs: updated });
    showToast("Fuente agregada");
  };

  const handleDeleteSrc = async (id) => {
    const updated = (config.incomeSrcs || []).filter(s => s.id !== id);
    await updateConfig({ incomeSrcs: updated });
    showToast("Fuente eliminada");
  };

  const handleChangePin = async (newPin) => {
    const profiles = (config.profiles || DEFAULT_PROFILES).map(p =>
      p.id === user.id ? { ...p, pin: newPin } : p
    );
    await updateConfig({ profiles });
    setUser(prev => ({ ...prev, pin: newPin }));
    showToast("PIN actualizado");
  };

  const handleAddProject = async (name, icon, description, goal) => {
    try {
      await addProjectDB({ name, icon, description, goal, createdAt: new Date().toISOString() });
      showToast("Proyecto creado");
    } catch { showToast("Error", false); }
  };

  const handleDeleteProject = async (id) => {
    try { await deleteProject(id); showToast("Proyecto eliminado"); }
    catch { showToast("Error", false); }
  };

  if (!config) return <LoadingScreen />;

  const cats = config.expenseCats || DEFAULT_EXPENSE_CATS;
  const srcs = config.incomeSrcs || DEFAULT_INCOME_SRCS;
  const profiles = config.profiles || DEFAULT_PROFILES;
  const getCat = id => cats.find(c => c.id === id);
  const getSrc = id => srcs.find(s => s.id === id);

  const getFiltered = (ownerF = null) => transactions.filter(t => {
    const d = new Date(t.date);
    if (d.getMonth() !== filterMonth || d.getFullYear() !== filterYear) return false;
    if (ownerF && t.owner !== ownerF && t.owner !== "ambos") return false;
    return true;
  });

  // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (screen === "login") {
    return (
      <LoginScreen
        profiles={profiles} selProfile={selProfile} pin={pin} pinErr={pinErr}
        onSelectProfile={handleProfileSelect}
        onPinKey={handlePinKey}
        onCancelPin={() => { setSelProfile(null); setPin(""); setPinErr(""); }}
      />
    );
  }

  if (screen === "add") {
    return (
      <AddScreen
        addType={addType} setAddType={setAddType}
        addCat={addCat} setAddCat={setAddCat}
        addSrc={addSrc} setAddSrc={setAddSrc}
        addOwner={addOwner} setAddOwner={setAddOwner}
        addAmount={addAmount} setAddAmount={setAddAmount}
        addCurrency={addCurrency} setAddCurrency={setAddCurrency}
        addDate={addDate} setAddDate={setAddDate}
        addDesc={addDesc} setAddDesc={setAddDesc}
        addMethod={addMethod} setAddMethod={setAddMethod}
        addProject={addProject} setAddProject={setAddProject}
        cats={cats} srcs={srcs} projects={projects}
        onSave={handleAddTx}
        onBack={() => setScreen("main")}
        onAddCatQuick={() => setModal("addCat")}
        onAddSrcQuick={() => setModal("addSrc")}
      />
    );
  }

  return (
    <MainScreen
      user={user} tab={tab} setTab={setTab}
      filterMonth={filterMonth} setFilterMonth={setFilterMonth}
      filterYear={filterYear} setFilterYear={setFilterYear}
      transactions={transactions} projects={projects}
      cats={cats} srcs={srcs}
      getCat={getCat} getSrc={getSrc}
      getFiltered={getFiltered}
      histFilter={histFilter} setHistFilter={setHistFilter}
      onAddScreen={() => { setAddOwner(user.id); setScreen("add"); }}
      onLogout={() => { setUser(null); setSelProfile(null); setScreen("login"); }}
      onDeleteTx={handleDeleteTx}
      onDeleteProject={handleDeleteProject}
      onAddProject={handleAddProject}
      onAddCat={handleAddCat} onDeleteCat={handleDeleteCat}
      onAddSrc={handleAddSrc} onDeleteSrc={handleDeleteSrc}
      onChangePin={handleChangePin}
      modal={modal} setModal={setModal}
      toast={toast}
    />
  );
}

// â”€â”€â”€ LOADING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-logo">ðŸ’°</div>
      <div className="loading-title">Money Maker</div>
      <div className="loading-spinner" />
      <p className="loading-sub">Conectando con Firebaseâ€¦</p>
    </div>
  );
}

// â”€â”€â”€ LOGIN SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LoginScreen({ profiles, selProfile, pin, pinErr, onSelectProfile, onPinKey, onCancelPin }) {
  const numKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, "â†", 0, "âœ“"];
  return (
    <div className="login-screen">
      <div className="login-header">
        <div className="login-logo">ðŸ’°</div>
        <h1 className="login-title">Money Maker</h1>
        <p className="login-sub">Control financiero familiar Â· Do Now</p>
      </div>

      {!selProfile ? (
        <>
          <p className="login-hint">Selecciona tu perfil</p>
          <div className="profile-grid">
            {profiles.map(p => (
              <button key={p.id} className="profile-card" onClick={() => onSelectProfile(p)}>
                <div className="profile-avatar" style={{ background: p.bg, color: p.color }}>{p.initials}</div>
                <div className="profile-name">{p.name}</div>
                <div className="profile-role">{p.role}</div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="pin-area">
          <p className="pin-label">PIN â€” {selProfile.name}</p>
          <div className="pin-dots">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`pin-dot ${i < pin.length ? "filled" : ""}`}
                style={{ "--dot-color": selProfile.color }} />
            ))}
          </div>
          {pinErr && <p className="pin-err">{pinErr}</p>}
          <div className="numpad">
            {numKeys.map((k, i) => (
              <button key={i} className="num-key" onClick={() => onPinKey(String(k))}>{k}</button>
            ))}
          </div>
          <button className="cancel-btn" onClick={onCancelPin}>Cancelar</button>
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ MAIN SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function MainScreen({
  user, tab, setTab, filterMonth, setFilterMonth, filterYear, setFilterYear,
  transactions, projects, cats, srcs, getCat, getSrc, getFiltered,
  histFilter, setHistFilter,
  onAddScreen, onLogout, onDeleteTx, onDeleteProject, onAddProject,
  onAddCat, onDeleteCat, onAddSrc, onDeleteSrc, onChangePin,
  modal, setModal, toast,
}) {
  const now = new Date();
  const month6Data = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const txs = transactions.filter(t => {
      const td = new Date(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    return { name: MONTHS[d.getMonth()], Ingresos: Math.round(sumI(txs)), Gastos: Math.round(sumE(txs)) };
  });

  const allFiltered = getFiltered();
  const inc = sumI(allFiltered), exp = sumE(allFiltered), bal = inc - exp;

  const byCat = cats.map(c => ({
    ...c, total: allFiltered.filter(t => t.type === "gasto" && t.category === c.id).reduce((s, t) => s + toMXN(t.amount, t.currency), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const bySrc = srcs.map(s => ({
    ...s, total: allFiltered.filter(t => t.type === "ingreso" && t.source === s.id).reduce((s2, t) => s2 + toMXN(t.amount, t.currency), 0)
  })).filter(s => s.total > 0).sort((a, b) => b.total - a.total);

  const histTxs = getFiltered().sort((a, b) => b.date.localeCompare(a.date))
    .filter(t => histFilter === "all" ? true : t.type === histFilter);

  const eduInc = sumI(getFiltered("eduardo")), eduExp = sumE(getFiltered("eduardo"));
  const hilInc = sumI(getFiltered("hilda")), hilExp = sumE(getFiltered("hilda"));

  const renderTx = (t, showDel = false) => {
    const meta = t.type === "gasto" ? getCat(t.category) : getSrc(t.source);
    return (
      <div key={t._id} className="tx-row">
        <span className="tx-icon">{meta?.icon || "ðŸ’°"}</span>
        <div className="tx-info">
          <div className="tx-desc">{t.description || meta?.label || "Sin descripciÃ³n"}</div>
          <div className="tx-meta">
            {t.date} Â· <span className={`owner-tag ${t.owner === "eduardo" ? "oe" : t.owner === "hilda" ? "oh" : "ob"}`}>{ownerLabel(t.owner)}</span>
            {t.projectId ? " Â· ðŸŽ¯" : ""}
            {t.currency && t.currency !== "MXN" ? ` Â· ${t.currency}` : ""}
          </div>
        </div>
        <div className="tx-right">
          <span className="tx-amt" style={{ color: t.type === "ingreso" ? "#86efac" : "#fca5a5" }}>
            {t.type === "ingreso" ? "+" : "-"}{fmtAmt(t.amount, t.currency || "MXN")}
          </span>
          {showDel && <button className="del-btn" onClick={() => onDeleteTx(t._id)}>Ã—</button>}
        </div>
      </div>
    );
  };

  const renderProjCard = (p) => {
    const ptxs = transactions.filter(t => t.projectId === p._id);
    const inv = sumE(ptxs), ret = sumI(ptxs), net = ret - inv;
    const roi = inv > 0 ? ((net / inv) * 100) : 0;
    const pct = p.goal > 0 ? Math.min(100, (ret / p.goal) * 100) : 0;
    const roiColor = roi > 0 ? "#86efac" : roi < -20 ? "#fca5a5" : "#fcd34d";
    return (
      <div key={p._id} className="proj-card">
        <div className="proj-head">
          <div>
            <div className="proj-name">{p.icon} {p.name}</div>
            {p.description && <div className="proj-desc">{p.description}</div>}
          </div>
          <div className="proj-badges">
            <span className="roi-badge" style={{ color: roiColor, background: roi > 0 ? "rgba(16,185,129,.12)" : roi < 0 ? "rgba(239,68,68,.12)" : "rgba(245,158,11,.12)" }}>
              ROI {roi >= 0 ? "+" : ""}{roi.toFixed(0)}%
            </span>
            <button className="icon-del" onClick={() => onDeleteProject(p._id)}>Ã—</button>
          </div>
        </div>
        {p.goal > 0 && (
          <>
            <div className="prog-bar"><div className="prog-fill" style={{ width: pct + "%", background: roi > 0 ? "#10b981" : "#3b82f6" }} /></div>
            <div className="prog-label">{pct.toFixed(0)}% de meta {fmtAmt(p.goal)}</div>
          </>
        )}
        <div className="proj-stats">
          {[["Invertido", inv, "#fca5a5"], ["Generado", ret, "#86efac"], ["Neto", net, net >= 0 ? "#86efac" : "#fca5a5"]].map(([l, v, c]) => (
            <div key={l} className="proj-stat"><div className="ps-label">{l}</div><div className="ps-val" style={{ color: c }}>{fmtAmt(v)}</div></div>
          ))}
        </div>
        <div className="proj-count">{ptxs.length} movimientos asociados</div>
      </div>
    );
  };

  const tabs = [
    { id: "dashboard", icon: "ðŸ“Š", label: "Resumen" },
    { id: "history",   icon: "ðŸ“‹", label: "Historial" },
    { id: "analytics", icon: "ðŸ“ˆ", label: "AnÃ¡lisis" },
    { id: "projects",  icon: "ðŸŽ¯", label: "Proyectos" },
    { id: "settings",  icon: "âš™ï¸", label: "Ajustes" },
  ];

  return (
    <div className="app">
      {/* Toast */}
      {toast && <div className={`toast ${toast.ok ? "toast-ok" : "toast-err"}`}>{toast.msg}</div>}

      {/* Modals */}
      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal === "addCat" && <AddCatModal onSave={async (n, ic, co) => { await onAddCat(n, ic, co); setModal(null); }} onClose={() => setModal(null)} />}
          {modal === "addSrc" && <AddSrcModal onSave={async (n, ic, co, ow) => { await onAddSrc(n, ic, co, ow); setModal(null); }} onClose={() => setModal(null)} />}
          {modal === "addProject" && <AddProjectModal onSave={async (n, ic, d, g) => { await onAddProject(n, ic, d, g); setModal(null); }} onClose={() => setModal(null)} />}
          {modal === "changePin" && <ChangePinModal user={user} onSave={async (np) => { await onChangePin(np); setModal(null); }} onClose={() => setModal(null)} />}
        </Modal>
      )}

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="tb-avatar" style={{ background: user.bg, color: user.color }}>{user.initials}</div>
          <div>
            <div className="tb-name">{user.name}</div>
            <div className="tb-role">{user.role}</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="month-sel">
            <select value={filterMonth} onChange={e => setFilterMonth(+e.target.value)}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(+e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="icon-btn" onClick={onLogout} title="Salir">ðŸšª</button>
        </div>
      </header>

      {/* Content */}
      <main className="main-content">
        {/* Tab pills */}
        <div className="tab-bar">
          {tabs.map(t => (
            <button key={t.id} className={`tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* â”€â”€ DASHBOARD â”€â”€ */}
        {tab === "dashboard" && (
          <>
            <div className="stat-row">
              <div className="stat-card" style={{ background: "linear-gradient(135deg,#0D2152,#1D4ED8)" }}>
                <div className="stat-label">Balance</div>
                <div className="stat-val" style={{ color: bal >= 0 ? "#86efac" : "#fca5a5" }}>{fmtAmt(bal)}</div>
              </div>
              <div className="stat-card" style={{ background: "linear-gradient(135deg,#064e3b,#059669)" }}>
                <div className="stat-label">â†‘ Ingresos</div>
                <div className="stat-val">{fmtAmt(inc)}</div>
              </div>
              <div className="stat-card" style={{ background: "linear-gradient(135deg,#7f1d1d,#dc2626)" }}>
                <div className="stat-label">â†“ Gastos</div>
                <div className="stat-val">{fmtAmt(exp)}</div>
              </div>
            </div>

            {byCat.length > 0 && (
              <section className="section">
                <h3 className="sec-title">Top gastos â€” {MONTHS[filterMonth]}</h3>
                {byCat.slice(0, 6).map(c => (
                  <div key={c.id} className="cat-row">
                    <span className="cat-icon">{c.icon}</span>
                    <div className="cat-info">
                      <div className="cat-name">{c.label}</div>
                      <div className="cat-bar"><div className="cat-fill" style={{ width: exp > 0 ? Math.min(100, (c.total / exp) * 100) + "%" : "0%", background: c.color }} /></div>
                    </div>
                    <div className="cat-amt">{fmtAmt(c.total)}</div>
                  </div>
                ))}
              </section>
            )}

            {bySrc.length > 0 && (
              <section className="section">
                <h3 className="sec-title">Ingresos por fuente</h3>
                {bySrc.map(s => (
                  <div key={s.id} className="cat-row">
                    <span className="cat-icon">{s.icon}</span>
                    <div className="cat-info">
                      <div className="cat-name">{s.label}</div>
                      <div className="src-owner" style={{ color: s.owner === "hilda" ? "#f9a8d4" : s.owner === "eduardo" ? "#93c5fd" : "#94a3b8" }}>{ownerLabel(s.owner)}</div>
                    </div>
                    <div className="cat-amt">{fmtAmt(s.total)}</div>
                  </div>
                ))}
              </section>
            )}

            <section className="section">
              <h3 className="sec-title">Ãšltimos movimientos</h3>
              {transactions.length === 0
                ? <p className="empty">Sin movimientos aÃºn. Â¡Toca âž• para agregar!</p>
                : transactions.slice(0, 6).map(t => renderTx(t, false))
              }
              {transactions.length > 6 && (
                <button className="see-all" onClick={() => setTab("history")}>Ver todo â†’</button>
              )}
            </section>
          </>
        )}

        {/* â”€â”€ HISTORY â”€â”€ */}
        {tab === "history" && (
          <>
            <div className="filter-bar">
              {["all", "ingreso", "gasto"].map(f => (
                <button key={f} className={`filter-btn ${histFilter === f ? "active" : ""}`} onClick={() => setHistFilter(f)}>
                  {f === "all" ? "Todo" : f === "ingreso" ? "â†‘ Ingresos" : "â†“ Gastos"}
                </button>
              ))}
            </div>
            <p className="hist-count">{histTxs.length} movimientos Â· {MONTHS[filterMonth]} {filterYear}</p>
            <section className="section">
              {histTxs.length === 0
                ? <p className="empty">Sin movimientos en este perÃ­odo</p>
                : histTxs.map(t => renderTx(t, true))
              }
            </section>
          </>
        )}

        {/* â”€â”€ ANALYTICS â”€â”€ */}
        {tab === "analytics" && (
          <>
            <section className="section">
              <h3 className="sec-title">Tendencia 6 meses</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={month6Data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
                  <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={v => "$" + Math.round(v / 1000) + "k"} />
                  <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#94a3b8" }} />
                  <Line type="monotone" dataKey="Ingresos" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 4" />
                </LineChart>
              </ResponsiveContainer>
              <div className="chart-legend">
                <span><span className="legend-dot" style={{ background: "#10b981" }} />Ingresos</span>
                <span><span className="legend-dot" style={{ background: "#ef4444" }} />Gastos</span>
              </div>
            </section>

            <section className="section">
              <h3 className="sec-title">Comparativa por persona</h3>
              {[
                { label: "Eduardo", color: "#3B82F6", inc: eduInc, exp: eduExp },
                { label: "Hilda", color: "#EC4899", inc: hilInc, exp: hilExp },
              ].map(o => (
                <div key={o.label} className="person-row">
                  <div className="person-head">
                    <span style={{ color: o.color, fontWeight: 700 }}>{o.label}</span>
                    <span className="person-bal" style={{ color: o.inc - o.exp >= 0 ? "#86efac" : "#fca5a5" }}>
                      Balance: {fmtAmt(o.inc - o.exp)}
                    </span>
                  </div>
                  <div className="person-bars">
                    <div className="pbar green">â†‘ {fmtAmt(o.inc)}</div>
                    <div className="pbar red">â†“ {fmtAmt(o.exp)}</div>
                  </div>
                </div>
              ))}
            </section>

            <section className="section">
              <h3 className="sec-title">Ranking gastos â€” {MONTHS[filterMonth]}</h3>
              {byCat.length === 0
                ? <p className="empty">Sin gastos este mes</p>
                : byCat.map((c, i) => (
                  <div key={c.id} className="rank-row">
                    <span className="rank-num">#{i + 1}</span>
                    <span className="rank-icon">{c.icon}</span>
                    <div className="rank-info">
                      <div className="rank-name">{c.label}</div>
                      <div className="rank-pct">{exp > 0 ? ((c.total / exp) * 100).toFixed(1) : 0}% del total</div>
                    </div>
                    <div className="rank-amt">{fmtAmt(c.total)}</div>
                  </div>
                ))
              }
            </section>
          </>
        )}

        {/* â”€â”€ PROJECTS â”€â”€ */}
        {tab === "projects" && (
          <>
            <div className="sec-header">
              <h2 className="sec-h2">Proyectos</h2>
              <button className="btn-primary-sm" onClick={() => setModal("addProject")}>+ Nuevo</button>
            </div>
            {projects.length === 0
              ? (
                <section className="section empty-state">
                  <div className="empty-icon">ðŸŽ¯</div>
                  <h3>Sin proyectos aÃºn</h3>
                  <p>Mide la rentabilidad de cursos, campaÃ±as, plataformas y mÃ¡s.</p>
                  <button className="btn-primary-sm" onClick={() => setModal("addProject")}>Crear proyecto</button>
                </section>
              )
              : projects.map(renderProjCard)
            }
          </>
        )}

        {/* â”€â”€ SETTINGS â”€â”€ */}
        {tab === "settings" && (
          <>
            <section className="section">
              <h3 className="sec-title">ðŸ‘¤ Mi perfil â€” {user.name}</h3>
              <div className="setting-row">
                <div><div className="s-label">PIN de acceso</div><div className="s-sub">Cambiar mi PIN de 4 dÃ­gitos</div></div>
                <button className="s-action" onClick={() => setModal("changePin")}>Cambiar PIN</button>
              </div>
              <div className="setting-row">
                <div><div className="s-label">Movimientos registrados</div></div>
                <span className="s-val">{transactions.length}</span>
              </div>
            </section>

            <section className="section">
              <h3 className="sec-title">â†“ CategorÃ­as de gasto <span className="sec-count">({cats.length})</span></h3>
              {cats.map(c => (
                <div key={c.id} className="custom-item">
                  <div className="ci-left"><span>{c.icon}</span><span>{c.label}</span></div>
                  {c.custom
                    ? <button className="ci-del" onClick={() => onDeleteCat(c.id)}>Ã—</button>
                    : <span className="ci-default">default</span>}
                </div>
              ))}
              <button className="add-custom-btn blue" onClick={() => setModal("addCat")}>+ Nueva categorÃ­a</button>
            </section>

            <section className="section">
              <h3 className="sec-title">â†‘ Fuentes de ingreso <span className="sec-count">({srcs.length})</span></h3>
              {srcs.map(s => (
                <div key={s.id} className="custom-item">
                  <div className="ci-left">
                    <span>{s.icon}</span>
                    <span style={{ color: s.owner === "hilda" ? "#f9a8d4" : s.owner === "eduardo" ? "#93c5fd" : "#94a3b8" }}>{s.label}</span>
                  </div>
                  {s.custom
                    ? <button className="ci-del" onClick={() => onDeleteSrc(s.id)}>Ã—</button>
                    : <span className="ci-default">default</span>}
                </div>
              ))}
              <button className="add-custom-btn green" onClick={() => setModal("addSrc")}>+ Nueva fuente de ingreso</button>
            </section>
          </>
        )}
      </main>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        <button className={`nav-btn ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}><span>ðŸ“Š</span><span>Resumen</span></button>
        <button className="nav-btn add-nav" onClick={onAddScreen}><span>âž•</span><span>Agregar</span></button>
        <button className={`nav-btn ${tab === "projects" ? "active" : ""}`} onClick={() => setTab("projects")}><span>ðŸŽ¯</span><span>Proyectos</span></button>
        <button className={`nav-btn ${tab === "analytics" ? "active" : ""}`} onClick={() => setTab("analytics")}><span>ðŸ“ˆ</span><span>AnÃ¡lisis</span></button>
        <button className={`nav-btn ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}><span>âš™ï¸</span><span>Ajustes</span></button>
      </nav>
    </div>
  );
}

// â”€â”€â”€ ADD SCREEN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddScreen({
  addType, setAddType, addCat, setAddCat, addSrc, setAddSrc,
  addOwner, setAddOwner, addAmount, setAddAmount, addCurrency, setAddCurrency,
  addDate, setAddDate, addDesc, setAddDesc, addMethod, setAddMethod,
  addProject, setAddProject, cats, srcs, projects,
  onSave, onBack, onAddCatQuick, onAddSrcQuick,
}) {
  return (
    <div className="app">
      <header className="topbar">
        <button className="back-btn" onClick={onBack}>â† Volver</button>
        <div className="topbar-title">Nuevo movimiento</div>
        <div style={{ width: 70 }} />
      </header>
      <div className="form-wrap">
        <div className="type-toggle">
          <button className={`type-btn ${addType === "gasto" ? "tg" : ""}`} onClick={() => setAddType("gasto")}>â†“ Gasto</button>
          <button className={`type-btn ${addType === "ingreso" ? "ti" : ""}`} onClick={() => setAddType("ingreso")}>â†‘ Ingreso</button>
        </div>

        <label className="flabel">Fecha</label>
        <input type="date" value={addDate} onChange={e => setAddDate(e.target.value)} className="finput" />

        <label className="flabel">Monto</label>
        <div className="curr-row">
          <select value={addCurrency} onChange={e => setAddCurrency(e.target.value)}>
            {Object.keys(CURRENCY_SYMBOLS).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" value={addAmount} onChange={e => setAddAmount(e.target.value)} placeholder="0.00" className="amount-input" />
        </div>

        {addType === "gasto" && (
          <>
            <label className="flabel">CategorÃ­a</label>
            <div className="chip-grid">
              {cats.map(c => (
                <button key={c.id} className={`chip ${addCat === c.id ? "sel" : ""}`}
                  style={addCat === c.id ? { background: c.color, borderColor: c.color, color: "#fff" } : {}}
                  onClick={() => setAddCat(c.id)}>{c.icon} {c.label}</button>
              ))}
              <button className="chip-add blue" onClick={onAddCatQuick}>+ Nueva</button>
            </div>
          </>
        )}

        {addType === "ingreso" && (
          <>
            <label className="flabel">Fuente de ingreso</label>
            <div className="chip-grid">
              {srcs.map(s => (
                <button key={s.id} className={`chip ${addSrc === s.id ? "sel" : ""}`}
                  style={addSrc === s.id ? { background: s.color, borderColor: s.color, color: "#fff" } : {}}
                  onClick={() => setAddSrc(s.id)}>{s.icon} {s.label}</button>
              ))}
              <button className="chip-add green" onClick={onAddSrcQuick}>+ Nueva</button>
            </div>
          </>
        )}

        <label className="flabel">Proyecto (opcional)</label>
        <select value={addProject} onChange={e => setAddProject(e.target.value)} className="finput">
          <option value="">Sin proyecto</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.icon} {p.name}</option>)}
        </select>

        <label className="flabel">DescripciÃ³n</label>
        <input value={addDesc} onChange={e => setAddDesc(e.target.value)} placeholder="Ej: Gasolina, pago clienteâ€¦" className="finput" />

        <label className="flabel">Â¿QuiÃ©n registra?</label>
        <div className="type-toggle" style={{ marginBottom: 14 }}>
          <button className={`type-btn ${addOwner === "eduardo" ? "tg" : ""}`} onClick={() => setAddOwner("eduardo")}>ðŸ‘¤ Eduardo</button>
          <button className={`type-btn ${addOwner === "hilda" ? "ti" : ""}`} onClick={() => setAddOwner("hilda")}>ðŸ‘© Hilda</button>
          <button className={`type-btn ${addOwner === "ambos" ? "tb" : ""}`} onClick={() => setAddOwner("ambos")}>ðŸ‘« Ambos</button>
        </div>

        <label className="flabel">MÃ©todo de pago</label>
        <select value={addMethod} onChange={e => setAddMethod(e.target.value)} className="finput">
          <option value="efectivo">ðŸ’µ Efectivo</option>
          <option value="debito">ðŸ’³ Tarjeta dÃ©bito</option>
          <option value="credito">ðŸ’³ Tarjeta crÃ©dito</option>
          <option value="transferencia">ðŸ¦ Transferencia</option>
          <option value="paypal">ðŸ…¿ï¸ PayPal</option>
          <option value="stripe">ðŸ’³ Stripe</option>
          <option value="otro">Otro</option>
        </select>

        <button className="save-btn" onClick={onSave}>âœ“ Guardar y sincronizar</button>
      </div>
    </div>
  );
}

// â”€â”€â”€ MODAL WRAPPER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">{children}</div>
    </div>
  );
}

// â”€â”€â”€ ADD CAT MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddCatModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("ðŸ“Œ");
  const [color, setColor] = useState(PALETTE[0]);
  return (
    <>
      <h3 className="modal-title">+ Nueva categorÃ­a de gasto</h3>
      <label className="flabel">Nombre</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Mascotas, Ropaâ€¦" className="finput" />
      <label className="flabel">Emoji</label>
      <input value={icon} onChange={e => setIcon(e.target.value)} style={{ width: 80, marginBottom: 12 }} />
      <label className="flabel">Color</label>
      <div className="color-grid">
        {PALETTE.map(c => <div key={c} className={`color-opt ${color === c ? "sel" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />)}
      </div>
      <div className="modal-btns">
        <button className="modal-cancel" onClick={onClose}>Cancelar</button>
        <button className="modal-ok" onClick={() => name && onSave(name, icon, color)}>Guardar</button>
      </div>
    </>
  );
}

// â”€â”€â”€ ADD SRC MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddSrcModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("ðŸ’¡");
  const [color, setColor] = useState(PALETTE[2]);
  const [owner, setOwner] = useState("eduardo");
  return (
    <>
      <h3 className="modal-title">+ Nueva fuente de ingreso</h3>
      <label className="flabel">Nombre</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: ConsultorÃ­as, Freelanceâ€¦" className="finput" />
      <label className="flabel">Emoji</label>
      <input value={icon} onChange={e => setIcon(e.target.value)} style={{ width: 80, marginBottom: 12 }} />
      <label className="flabel">Â¿De quiÃ©n?</label>
      <div className="type-toggle" style={{ marginBottom: 12 }}>
        {[["eduardo", "ðŸ‘¤ Eduardo"], ["hilda", "ðŸ‘© Hilda"], ["ambos", "ðŸ‘« Ambos"]].map(([v, l]) => (
          <button key={v} className={`type-btn ${owner === v ? "tb" : ""}`} onClick={() => setOwner(v)}>{l}</button>
        ))}
      </div>
      <label className="flabel">Color</label>
      <div className="color-grid">
        {PALETTE.map(c => <div key={c} className={`color-opt ${color === c ? "sel" : ""}`} style={{ background: c }} onClick={() => setColor(c)} />)}
      </div>
      <div className="modal-btns">
        <button className="modal-cancel" onClick={onClose}>Cancelar</button>
        <button className="modal-ok" onClick={() => name && onSave(name, icon, color, owner)}>Guardar</button>
      </div>
    </>
  );
}

// â”€â”€â”€ ADD PROJECT MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AddProjectModal({ onSave, onClose }) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("ðŸŽ¯");
  const [desc, setDesc] = useState("");
  const [goal, setGoal] = useState("");
  return (
    <>
      <h3 className="modal-title">ðŸŽ¯ Nuevo proyecto</h3>
      <label className="flabel">Nombre</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Curso IA 2026, CampaÃ±a Meta Q2" className="finput" />
      <label className="flabel">Emoji</label>
      <input value={icon} onChange={e => setIcon(e.target.value)} style={{ width: 80, marginBottom: 12 }} />
      <label className="flabel">DescripciÃ³n (opcional)</label>
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Breve descripciÃ³nâ€¦" className="finput" />
      <label className="flabel">Meta de ingresos MXN (0 = sin meta)</label>
      <input type="number" value={goal} onChange={e => setGoal(e.target.value)} placeholder="0" className="finput" />
      <div className="modal-btns">
        <button className="modal-cancel" onClick={onClose}>Cancelar</button>
        <button className="modal-ok" onClick={() => name && onSave(name, icon, desc, parseFloat(goal) || 0)}>Guardar</button>
      </div>
    </>
  );
}

// â”€â”€â”€ CHANGE PIN MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChangePinModal({ user, onSave, onClose }) {
  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [conf, setConf] = useState("");
  const [err, setErr] = useState("");
  const handle = () => {
    if (oldPin !== user.pin) return setErr("PIN actual incorrecto");
    if (!/^\d{4}$/.test(newPin)) return setErr("El nuevo PIN debe ser 4 dÃ­gitos");
    if (newPin !== conf) return setErr("Los PINs no coinciden");
    onSave(newPin);
  };
  return (
    <>
      <h3 className="modal-title">ðŸ” Cambiar PIN â€” {user.name}</h3>
      {[["PIN actual", oldPin, setOldPin], ["Nuevo PIN", newPin, setNewPin], ["Confirmar nuevo PIN", conf, setConf]].map(([l, v, s]) => (
        <div key={l}>
          <label className="flabel">{l}</label>
          <input type="password" maxLength={4} value={v} onChange={e => { s(e.target.value); setErr(""); }} className="finput pin-input" />
        </div>
      ))}
      {err && <p className="pin-err">{err}</p>}
      <div className="modal-btns">
        <button className="modal-cancel" onClick={onClose}>Cancelar</button>
        <button className="modal-ok" onClick={handle}>Guardar</button>
      </div>
    </>
  );
}
