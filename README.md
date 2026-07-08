# 💰 Money Maker — Do Now Familia

Control financiero familiar con sincronización en tiempo real via Firebase.

## Perfiles por defecto
- **Eduardo** — PIN: `1234`
- **Hilda** — PIN: `5678`

> ⚠️ Cambia los PINs desde la app en Ajustes → Mi perfil → Cambiar PIN

## Deploy en Vercel (paso a paso)

### 1. Sube a GitHub
1. Crea un repositorio nuevo en github.com (ej: `money-maker`)
2. Sube todos estos archivos al repositorio

### 2. Conecta con Vercel
1. Ve a vercel.com → New Project
2. Importa el repositorio de GitHub
3. Vercel detecta automáticamente que es Create React App
4. Clic en Deploy — listo en ~2 minutos

### 3. Configura Firebase (Firestore Rules)
En Firebase Console → Firestore → Reglas, pega esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## Funcionalidades
- ✅ Perfiles con PIN por persona (Eduardo y Hilda)
- ✅ Sincronización en tiempo real via Firestore
- ✅ Multi-moneda (MXN, USD, EUR, GBP)
- ✅ 15 categorías de gasto + personalizables
- ✅ 12 fuentes de ingreso (Sabkuh, Happytoc, Ohmyle, Do Now, Organify...) + personalizables
- ✅ Proyectos con ROI automático
- ✅ Análisis: tendencia 6 meses, comparativa por persona, ranking de gastos
- ✅ Instalable como PWA en móvil
