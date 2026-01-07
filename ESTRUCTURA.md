# Estructura del Proyecto ServiSV

## 📁 Estructura de Carpetas

```
servisv-app/
├── src/
│   ├── app/                          # Rutas de la aplicación (Expo Router)
│   │   ├── (tabs)/                   # Navegación por tabs
│   │   │   ├── _layout.tsx          # Layout de las tabs
│   │   │   ├── index.tsx            # 🏠 Home
│   │   │   ├── servicios.tsx        # 🔧 Servicios
│   │   │   ├── chats.tsx            # 💬 Chats
│   │   │   ├── perfil.tsx           # 👤 Perfil
│   │   │   └── trabajos.tsx         # 💼 Trabajos
│   │   ├── _layout.tsx              # Layout principal
│   │   └── crear-solicitud.tsx      # Modal para crear solicitud
│   │
│   ├── common/                       # Código compartido
│   │   ├── components/              # Componentes comunes
│   │   │   ├── Header.tsx           # Header de la app
│   │   │   ├── SearchBar.tsx        # Barra de búsqueda
│   │   │   ├── CategoriaCard.tsx    # Card de categoría
│   │   │   ├── Button.tsx           # Botón reutilizable
│   │   │   └── index.ts             # Exportaciones
│   │   │
│   │   ├── types/                   # Tipos TypeScript
│   │   │   ├── solicitud.ts         # Tipos de solicitudes
│   │   │   ├── categoria.ts         # Tipos de categorías
│   │   │   ├── servicio.ts          # Tipos de servicios
│   │   │   ├── chat.ts              # Tipos de chat
│   │   │   ├── usuario.ts           # Tipos de usuario
│   │   │   └── index.ts             # Exportaciones
│   │   │
│   │   ├── hooks/                   # Custom hooks
│   │   ├── services/                # Servicios (API, etc.)
│   │   ├── providers/               # Context providers
│   │   ├── utils/                   # Funciones utilitarias
│   │   ├── store/                   # Estado global (Zustand)
│   │   └── lib/                     # Librerías configuradas
│   │
│   └── features/                     # Features específicas
│       ├── solicitudes/
│       │   └── components/
│       │       ├── MisSolicitudesCard.tsx
│       │       └── NuevaSolicitudCard.tsx
│       ├── servicios/
│       │   └── components/
│       │       └── ExplorarServiciosCard.tsx
│       ├── chats/
│       ├── perfil/
│       └── trabajos/
│
├── components/                       # Componentes base de Expo
├── hooks/                           # Hooks base de Expo
├── constants/                       # Constantes de la app
├── assets/                          # Imágenes y recursos
└── ...archivos de configuración
```

## 🎨 Tabs de la Aplicación

### 1. 🏠 Home (index.tsx)
- Saludo personalizado
- Barra de búsqueda
- **Mis Solicitudes**: Muestra el total de solicitudes (abiertas/completadas)
- **Nueva Solicitud**: Botón para crear una nueva solicitud
- **Explorar Servicios**: Acceso rápido a servicios
- **Categorías populares**: Grid con las categorías más usadas

### 2. 🔧 Servicios (servicios.tsx)
- Listado de todas las categorías de servicios
- Búsqueda de servicios
- Navegación a proveedores por categoría

### 3. 💬 Chats (chats.tsx)
- Lista de conversaciones
- Indicadores de mensajes no leídos
- Vista previa del último mensaje

### 4. 👤 Perfil (perfil.tsx)
- Información del usuario
- Calificación y reseñas
- Opciones de configuración
- Cerrar sesión

### 5. 💼 Trabajos (trabajos.tsx)
- Todas las solicitudes del usuario
- Filtros por estado (todas, abierta, en progreso, completada)
- Detalles de cada solicitud

## 🎯 Categorías Populares

1. **Fontanería** 🔧 - 50+ proveedores
2. **Electricidad** ⚡ - 45+ proveedores
3. **Limpieza** 🧹 - 80+ proveedores
4. **Jardinería** 🌿 - 30+ proveedores
5. **Pintura** 🎨 - 25+ proveedores
6. **Carpintería** 🔨 - 20+ proveedores

## 🔧 Tecnologías

- **Expo Router**: Navegación basada en archivos
- **NativeWind**: Tailwind CSS para React Native
- **TypeScript**: Tipado estático
- **React Native**: Framework principal

## 📱 Rutas

```
/                          → Home
/(tabs)/servicios         → Servicios
/(tabs)/chats             → Chats
/(tabs)/perfil            → Perfil
/(tabs)/trabajos          → Trabajos
/crear-solicitud          → Modal para crear solicitud
```

## 🎨 Paleta de Colores

- **Primary**: Azul (#3B82F6)
- **Secondary**: Púrpura (#9333EA)
- **Success**: Verde (#10B981)
- **Warning**: Amarillo (#F59E0B)
- **Error**: Rojo (#EF4444)

## 📝 Notas

- La estructura sigue el patrón de **mannwork-app**
- Los componentes usan **NativeWind** para estilos
- Los tipos están centralizados en `src/common/types`
- Las features tienen sus propios componentes específicos

