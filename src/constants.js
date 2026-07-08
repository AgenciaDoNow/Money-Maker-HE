export const DEFAULT_PROFILES = [
  { id: "eduardo", name: "Eduardo", initials: "ED", color: "#3B82F6", bg: "rgba(59,130,246,.2)", pin: "1234", role: "Do Now · Organify" },
  { id: "hilda",   name: "Hilda",   initials: "HI", color: "#EC4899", bg: "rgba(236,72,153,.2)",  pin: "5678", role: "Sabkuh · Happytoc · Ohmyle" },
];

export const DEFAULT_EXPENSE_CATS = [
  { id: "personal_edu",  label: "Personal Eduardo",       icon: "👤", color: "#3B82F6" },
  { id: "personal_hil",  label: "Personal Hilda",         icon: "👩", color: "#EC4899" },
  { id: "inversion",     label: "Inversión",              icon: "📈", color: "#10B981" },
  { id: "plataformas",   label: "Plataformas digitales",  icon: "💻", color: "#8B5CF6" },
  { id: "viaticos",      label: "Viáticos / Gasolina",    icon: "⛽", color: "#F59E0B" },
  { id: "salud",         label: "Salud / Medicamentos",   icon: "🏥", color: "#EF4444" },
  { id: "alimentos",     label: "Alimentos / Despensa",   icon: "🛒", color: "#84CC16" },
  { id: "hogar_prod",    label: "Productos hogar",        icon: "🏠", color: "#06B6D4" },
  { id: "hogar_serv",    label: "Servicios hogar",        icon: "💡", color: "#F97316" },
  { id: "tarjetas",      label: "Tarjetas / Préstamos",   icon: "💳", color: "#DC2626" },
  { id: "suscripciones", label: "Suscripciones / Apps",   icon: "📱", color: "#7C3AED" },
  { id: "educacion",     label: "Educación / Cursos",     icon: "🎓", color: "#0EA5E9" },
  { id: "entretenimiento", label: "Entretenimiento",      icon: "🎉", color: "#F472B6" },
  { id: "impuestos",     label: "Impuestos / Contabilidad", icon: "📑", color: "#6B7280" },
  { id: "extras",        label: "Extras / Imprevistos",   icon: "⚡", color: "#FBBF24" },
];

export const DEFAULT_INCOME_SRCS = [
  { id: "sabkuh",        label: "Sabkuh – Mentoría",           owner: "hilda",   icon: "🌿", color: "#10B981" },
  { id: "happytoc_prod", label: "Happytoc – Productividad",    owner: "hilda",   icon: "✅", color: "#3B82F6" },
  { id: "happytoc_info", label: "Happytoc – Infoproductos",    owner: "hilda",   icon: "📋", color: "#60A5FA" },
  { id: "ohmyle_1a1",    label: "Ohmyle – Consultoría 1:1",   owner: "hilda",   icon: "🔮", color: "#8B5CF6" },
  { id: "ohmyle_taller", label: "Ohmyle – Talleres",          owner: "hilda",   icon: "🎙️", color: "#A78BFA" },
  { id: "ohmyle_tienda", label: "Ohmyle – Tienda online",     owner: "hilda",   icon: "🛍️", color: "#C4B5FD" },
  { id: "donow",         label: "Do Now – Agencia",           owner: "eduardo", icon: "🚀", color: "#1D4ED8" },
  { id: "organify",      label: "Organify – Sistema comercial", owner: "eduardo", icon: "🏢", color: "#2563EB" },
  { id: "ventas",        label: "Ventas en línea",            owner: "eduardo", icon: "🛒", color: "#0891B2" },
  { id: "inversiones",   label: "Ganancias inversiones",      owner: "eduardo", icon: "📈", color: "#10B981" },
  { id: "apps_web",      label: "Apps / Membresías",          owner: "eduardo", icon: "💻", color: "#0EA5E9" },
  { id: "otros",         label: "Otros ingresos",             owner: "ambos",   icon: "💰", color: "#6B7280" },
];

export const PALETTE = [
  "#3B82F6","#EC4899","#10B981","#8B5CF6","#F59E0B",
  "#EF4444","#84CC16","#06B6D4","#F97316","#7C3AED",
  "#0EA5E9","#F472B6","#FBBF24","#6B7280","#DC2626",
];

export const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
export const RATES  = { MXN: 1, USD: 17.5, EUR: 19, GBP: 23 };
export const CURRENCY_SYMBOLS = { MXN: "$", USD: "US$", EUR: "€", GBP: "£" };

export const toMXN = (amount, currency) => amount * (RATES[currency] || 1);
export const fmtAmt = (n, currency = "MXN") => {
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  const abs = Math.abs(n);
  const str = abs >= 1000 ? abs.toLocaleString("es-MX", { maximumFractionDigits: 0 }) : abs.toFixed(2);
  return sym + str + (currency !== "MXN" ? " " + currency : "");
};
export const uid = () => Math.random().toString(36).slice(2, 9);
export const todayStr = () => new Date().toISOString().split("T")[0];
export const ownerLabel = (o) => o === "eduardo" ? "Eduardo" : o === "hilda" ? "Hilda" : "Ambos";
