# 📦 Dependencias Necesarias

Para que la integración con Supabase funcione correctamente, necesitas instalar las siguientes dependencias:

## Instalación

```bash
npm install @supabase/supabase-js @tanstack/react-query react-native-url-polyfill
```

O si usas yarn:

```bash
yarn add @supabase/supabase-js @tanstack/react-query react-native-url-polyfill
```

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## Estructura de Base de Datos

La aplicación espera las siguientes tablas en Supabase:

### Tabla `requests` (Categorías)
- `id` (int8, primary key)
- `name` (text)
- `icon_url` (text, nullable)
- `category_type` (text) - valores: 'technical' o 'professional'
- `created_at` (timestamptz)

### Tabla `subcategories`
- `id` (uuid, primary key)
- `name` (text)
- `created_at` (timestamptz)

### Tabla `category_subcategory` (Tabla intermedia)
- `category_id` (int8, foreign key a requests.id)
- `subcategory_id` (uuid, foreign key a subcategories.id)
- `id` (uuid, primary key)
- `created_at` (timestamptz)

## Uso

Una vez instaladas las dependencias y configuradas las variables de entorno, el componente `SelectServices` en el onboarding cargará automáticamente las categorías desde la base de datos.
