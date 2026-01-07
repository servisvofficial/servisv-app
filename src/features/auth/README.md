# 🔐 Módulo de Autenticación - ServiSV

## 📁 Estructura

```
features/auth/
├── onboarding/
│   └── components/
│       └── OnboardingSlides.tsx       # 3 slides de introducción
│
├── sign-in/
│   ├── components/
│   │   └── LoginForm.tsx              # Formulario de login
│   └── validators/                    # Validaciones de login
│
└── sign-up/
    ├── components/
    │   ├── HeaderRegisterSteps.tsx    # Header compartido con progreso
    │   ├── RolSelect.tsx              # Selección Cliente/Proveedor
    │   ├── PersonalData.tsx           # Paso 1: Datos personales
    │   ├── VerifyIdentity.tsx         # Paso 2: Verificación DUI
    │   ├── SelectServices.tsx         # Paso 3: Selección de servicios
    │   ├── ServiceZone.tsx            # Paso 4: Zona de servicio
    │   └── ReviewData.tsx             # Revisión final de datos
    ├── validators/                    # Validaciones de registro
    └── store/                         # Estado del registro (Zustand)
```

## 🎯 Componentes

### **OnboardingSlides**
```tsx
import OnboardingSlides from '@/features/auth/onboarding/components/OnboardingSlides';
```
- Muestra 3 slides con scroll horizontal
- Indicadores de página (dots)
- Botón "Siguiente" / "Comenzar"
- Botón "Saltar" en la esquina superior

### **LoginForm**
```tsx
import LoginForm from '@/features/auth/sign-in/components/LoginForm';
```
- Campo de email o DUI
- Campo de contraseña con toggle mostrar/ocultar
- Link "¿Olvidaste tu contraseña?"
- Botón de login
- Link para ir a registro

### **HeaderRegisterSteps**
```tsx
import HeaderRegisterSteps from '@/features/auth/sign-up/components/HeaderRegisterSteps';

<HeaderRegisterSteps 
  currentStep={1}
  totalSteps={4}
  title="Regístrate como Proveedor"
/>
```
Header reutilizable que muestra:
- Botón back
- Título
- Indicador "Paso X de Y"
- Barra de progreso animada

### **RolSelect**
```tsx
import RolSelect from '@/features/auth/sign-up/components/RolSelect';
```
Pantalla de selección de tipo de usuario:
- Card "Cliente" (blanco con borde)
- Card "Proveedor" (con gradiente azul)
- Link para ir a login

### **PersonalData** (Paso 1)
```tsx
import PersonalData from '@/features/auth/sign-up/components/PersonalData';
```
Formulario con:
- Nombre completo
- Email
- Contraseña (con validación mínimo 6 caracteres)

### **VerifyIdentity** (Paso 2)
```tsx
import VerifyIdentity from '@/features/auth/sign-up/components/VerifyIdentity';
```
Verificación de identidad:
- Input de número de DUI
- Upload de foto DUI frontal
- Upload de foto DUI reverso

### **SelectServices** (Paso 3)
```tsx
import SelectServices from '@/features/auth/sign-up/components/SelectServices';
```
Selección múltiple de servicios:
- Grid de categorías con iconos
- Selección visual con borde azul y checkmark
- Contador de servicios seleccionados

### **ServiceZone** (Paso 4)
```tsx
import ServiceZone from '@/features/auth/sign-up/components/ServiceZone';
```
Configuración de zona:
- Mapa (placeholder)
- Campo de ubicación base
- Slider de radio de servicio (1-50 km)

### **ReviewData**
```tsx
import ReviewData from '@/features/auth/sign-up/components/ReviewData';
```
Revisión final con:
- Sección de datos personales (editable)
- Sección de servicios (editable)
- Sección de zona de servicio (editable)
- Botón "Crear Cuenta"

## 🎨 Estilos

Todos los componentes usan **NativeWind** (Tailwind CSS):

### Colores principales:
- **Primary Blue**: `#3B82F6`
- **Purple**: `#9333EA`
- **Green**: `#10B981`
- **Gray 50**: `#F9FAFB`
- **Gray 900**: `#111827`

### Botones:
```tsx
// Botón primario
className="bg-blue-500 py-4 px-6 rounded-xl"

// Botón deshabilitado
style={{ backgroundColor: isValid ? '#3B82F6' : '#D1D5DB' }}
```

### Cards:
```tsx
// Card normal
className="bg-white rounded-2xl p-5 border border-gray-200"

// Card seleccionado
className="border-blue-500 bg-blue-50"
```

## 🔄 Flujo de Datos

### 1. **Store de Registro** (Recomendado)
Crear un store con Zustand para persistir datos entre pasos:

```typescript
// store/auth.store.ts
import { create } from 'zustand';

interface SignUpData {
  // Paso 1
  nombre: string;
  email: string;
  password: string;
  
  // Paso 2
  dui: string;
  duiFrontal: string | null;
  duiReverso: string | null;
  
  // Paso 3
  servicios: string[];
  
  // Paso 4
  ubicacion: {
    direccion: string;
    latitud: number;
    longitud: number;
  };
  radioServicio: number;
}

interface AuthStore {
  signUpData: SignUpData;
  updateSignUpData: (data: Partial<SignUpData>) => void;
  clearSignUpData: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  signUpData: {
    nombre: '',
    email: '',
    password: '',
    dui: '',
    duiFrontal: null,
    duiReverso: null,
    servicios: [],
    ubicacion: {
      direccion: '',
      latitud: 0,
      longitud: 0,
    },
    radioServicio: 15,
  },
  updateSignUpData: (data) =>
    set((state) => ({
      signUpData: { ...state.signUpData, ...data },
    })),
  clearSignUpData: () =>
    set({
      signUpData: {
        nombre: '',
        email: '',
        password: '',
        dui: '',
        duiFrontal: null,
        duiReverso: null,
        servicios: [],
        ubicacion: {
          direccion: '',
          latitud: 0,
          longitud: 0,
        },
        radioServicio: 15,
      },
    }),
}));
```

### 2. **Validadores**
Crear validadores para cada paso:

```typescript
// validators/personalData.validator.ts
export const validatePersonalData = (data: {
  nombre: string;
  email: string;
  password: string;
}) => {
  const errors: Record<string, string> = {};

  if (!data.nombre.trim()) {
    errors.nombre = 'El nombre es requerido';
  }

  if (!data.email.trim()) {
    errors.email = 'El email es requerido';
  } else if (!/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Email inválido';
  }

  if (data.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```

## 📝 Tareas Pendientes

### Implementación Backend:
- [ ] Integrar API de registro
- [ ] Integrar API de login
- [ ] Manejo de tokens (JWT)
- [ ] Refresh tokens

### Funcionalidades:
- [ ] Subida real de fotos del DUI
- [ ] Integración con Google Maps / MapBox
- [ ] Geolocalización automática
- [ ] Validación de email con código
- [ ] Recuperación de contraseña
- [ ] Login con redes sociales (Google, Apple)

### Validaciones:
- [ ] Formato de DUI salvadoreño
- [ ] Verificación de email único
- [ ] Validación de contraseña fuerte
- [ ] Rate limiting en login

### UX Improvements:
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Animaciones de transición
- [ ] Keyboard handling
- [ ] Accessibility (a11y)

## 🧪 Testing

```typescript
// Ejemplo de test para PersonalData
import { render, fireEvent } from '@testing-library/react-native';
import PersonalData from './PersonalData';

describe('PersonalData', () => {
  it('should disable next button when form is invalid', () => {
    const { getByText } = render(<PersonalData />);
    const nextButton = getByText('Siguiente');
    
    expect(nextButton).toBeDisabled();
  });
  
  it('should enable next button when form is valid', () => {
    const { getByPlaceholderText, getByText } = render(<PersonalData />);
    
    fireEvent.changeText(getByPlaceholderText('Juan Pérez'), 'Juan Pérez');
    fireEvent.changeText(getByPlaceholderText('tu.correo@ejemplo.com'), 'juan@email.com');
    fireEvent.changeText(getByPlaceholderText('Mínimo 6 caracteres'), '123456');
    
    const nextButton = getByText('Siguiente');
    expect(nextButton).not.toBeDisabled();
  });
});
```

## 🔗 Referencias

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

