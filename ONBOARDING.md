# 🚀 Flujo de Onboarding - ServiSV

## 📱 Estructura del Flujo

### 1. **Onboarding Slides** (`/onboarding`)
Tres pantallas de introducción con scroll horizontal:
- 🔍 **Slide 1**: "Busca lo que necesitas"
- 👷 **Slide 2**: "Encuentra a profesionales" 
- 🤝 **Slide 3**: "Conecta y contrata"

**Navegación:**
- Botón "Siguiente" → Siguiente slide
- Última pantalla → "Comenzar" → Selección de tipo de usuario
- Botón "Saltar" → Directo a selección de tipo de usuario

---

### 2. **Selección de Tipo de Usuario** (`/sign-up/index`)
El usuario elige cómo quiere usar la app:

#### Opción A: **Cliente**
- Card blanco con borde gris
- Icono de persona
- Click → Va directo a la app (tabs)

#### Opción B: **Proveedor** (Destacado)
- Card con gradiente azul-púrpura
- Icono de herramientas
- Click → Inicia flujo de registro de proveedor (4 pasos)

**Navegación adicional:**
- Link "¿Ya tienes cuenta?" → Login

---

### 3. **Login** (`/sign-in`)
Pantalla de inicio de sesión con:
- Icon de casa con gradiente
- Campo: Email o DUI
- Campo: Contraseña (con mostrar/ocultar)
- Link: "¿Olvidaste tu contraseña?"
- Botón: "Iniciar Sesión" → App principal
- Link: "¿No tienes cuenta?" → Sign-up

---

## 👷 Flujo de Registro de Proveedor (4 Pasos)

Todos los pasos tienen:
- Header con botón back
- Barra de progreso (Paso X de 4)
- Botón "Siguiente" en la parte inferior

### **Paso 1: Datos Personales** (`/sign-up/personal-data`)
Campos:
- ✏️ Nombre completo
- ✉️ Correo electrónico
- 🔒 Contraseña (mínimo 6 caracteres con toggle para ver)

Validación: Todos los campos requeridos

---

### **Paso 2: Verificación de Identidad** (`/sign-up/verify-identity`)
Contenido:
- 📝 Título: "Verifica tu identidad"
- 📋 Campo: Número de DUI (formato: 00000000-0)
- 📷 Upload: Foto DUI Frente (área con borde punteado)
- 📷 Upload: Foto DUI Reverso (área con borde punteado)

Validación: DUI + ambas fotos requeridas

---

### **Paso 3: Selección de Servicios** (`/sign-up/select-services`)
- 📝 Título: "Selecciona los servicios que ofreces"
- Grid de categorías (6 opciones):
  - 🔧 Fontanería
  - ⚡ Electricidad
  - 🧹 Limpieza
  - 🌿 Jardinería
  - 🎨 Pintura
  - 🔨 Carpintería

**Interacción:**
- Cards seleccionables (borde azul cuando están activos)
- Checkmark en esquina superior derecha
- Contador de servicios seleccionados
- Múltiple selección permitida

Validación: Al menos 1 servicio seleccionado

---

### **Paso 4: Zona de Servicio** (`/sign-up/service-zone`)
Contenido:
- 📝 Título: "Configura tu zona de servicio"
- 🗺️ Mapa interactivo (placeholder con pin)
- 📍 Campo: Ubicación base (ej: "Colonia Escalón, San Salvador")
- 🎯 Slider: Radio de servicio (1-50 km)
  - Valor dinámico mostrado en azul
  - Slider con color azul
- 💡 Info box: Explicación sobre el radio de servicio

Validación: Ubicación seleccionada

---

### 5. **Revisión de Datos** (`/sign-up/review`)
Pantalla de resumen final con 3 secciones editables:

#### 📋 **DATOS PERSONALES** (con botón ✏️ Editar)
- Nombre completo: "Juan Pérez"
- Correo: "juan.perez@email.com"
- DUI: "12345678-9"

#### 🔧 **SERVICIOS** (con botón ✏️ Editar)
- Lista de servicios con sub-items:
  - Fontanería
    - Reparación de fugas
    - Instalación de grifos
  - Electricidad
    - Instalaciones eléctricas

#### 🗺️ **ZONA DE SERVICIO** (con botón ✏️ Editar)
- Ubicación base: "Colonia Escalón, San Salvador"
- Radio: "15 km"

**Acciones:**
- Botón principal: "Crear Cuenta" → App principal
- Link: "¿Ya tienes cuenta?" → Login

---

## 📂 Estructura de Carpetas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── onboarding.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up/
│   │       ├── _layout.tsx
│   │       ├── index.tsx              # Tipo de usuario
│   │       ├── personal-data.tsx      # Paso 1
│   │       ├── verify-identity.tsx    # Paso 2
│   │       ├── select-services.tsx    # Paso 3
│   │       ├── service-zone.tsx       # Paso 4
│   │       └── review.tsx             # Revisión final
│   ├── index.tsx                      # Redirect inicial
│   └── _layout.tsx
│
└── features/
    └── auth/
        ├── onboarding/
        │   └── components/
        │       └── OnboardingSlides.tsx
        ├── sign-in/
        │   └── components/
        │       └── LoginForm.tsx
        └── sign-up/
            ├── components/
            │   ├── HeaderRegisterSteps.tsx
            │   ├── RolSelect.tsx
            │   ├── PersonalData.tsx
            │   ├── VerifyIdentity.tsx
            │   ├── SelectServices.tsx
            │   ├── ServiceZone.tsx
            │   └── ReviewData.tsx
            ├── validators/
            └── store/
```

## 🎨 Componentes Compartidos

### **HeaderRegisterSteps**
Header reutilizable para los 4 pasos del registro:
- Props: `currentStep`, `totalSteps`, `title`
- Muestra progreso visual con barra
- Botón de back para volver

### **Buttons**
- Primario: Gradiente azul-púrpura (#3B82F6 → #9333EA)
- Estados: Normal, Disabled (gris)
- Full width con padding vertical

## 🎯 Navegación

```
App Inicio
  ↓
Onboarding Slides (3 slides)
  ↓
Tipo de Usuario
  ├─→ Cliente → App Principal (Tabs)
  └─→ Proveedor → Paso 1: Datos Personales
                   ↓
                   Paso 2: Verificación DUI
                   ↓
                   Paso 3: Selección Servicios
                   ↓
                   Paso 4: Zona de Servicio
                   ↓
                   Revisión Final
                   ↓
                   App Principal (Tabs)

Login ────────────→ App Principal (Tabs)
```

## 🛠️ Tecnologías Usadas

- **Expo Router**: Navegación basada en archivos
- **NativeWind**: Estilos con Tailwind
- **React Native Reanimated**: Animaciones (slides)
- **@react-native-community/slider**: Slider del radio de servicio
- **expo-linear-gradient**: Gradientes en botones
- **expo-image-picker**: Para subir fotos del DUI

## 📝 Notas de Implementación

1. **Validaciones**: Cada paso valida que los campos requeridos estén completos antes de habilitar "Siguiente"
2. **Persistencia**: Los datos del registro deberían guardarse en un store (Zustand) para mantenerlos entre pasos
3. **Fotos**: Implementar lógica real de subida de fotos con expo-image-picker
4. **Mapa**: Integrar un mapa real (Google Maps o MapBox) en el paso 4
5. **Autenticación**: Conectar con backend real para login y registro

