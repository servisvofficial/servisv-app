import React, { createContext, useContext, useState, ReactNode } from 'react';

type UserType = 'client' | 'provider';

interface RegistrationData {
  userType: UserType | null;
  nombre: string;
  apellido: string;
  email: string;
  dui: string;
  password: string;
  tipoVivienda?: string;
  direccion?: string;
  solvenciaPolicial?: string | null;
  duiFrontal?: string | null;
  duiReverso?: string | null;
  servicios?: string[];
  ubicacion?: string;
  radioServicio?: number;
  nombreBanco?: string;
  tipoCuenta?: string;
  numeroCuenta?: string;
}

interface RegistrationContextType {
  registrationData: RegistrationData;
  setUserType: (type: UserType) => void;
  updateRegistrationData: (data: Partial<RegistrationData>) => void;
  resetRegistrationData: () => void;
}

const initialData: RegistrationData = {
  userType: null,
  nombre: '',
  apellido: '',
  email: '',
  dui: '',
  password: '',
};

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider = ({ children }: { children: ReactNode }) => {
  const [registrationData, setRegistrationData] = useState<RegistrationData>(initialData);

  const setUserType = (type: UserType) => {
    setRegistrationData(prev => ({ ...prev, userType: type }));
  };

  const updateRegistrationData = (data: Partial<RegistrationData>) => {
    setRegistrationData(prev => ({ ...prev, ...data }));
  };

  const resetRegistrationData = () => {
    setRegistrationData(initialData);
  };

  return (
    <RegistrationContext.Provider
      value={{
        registrationData,
        setUserType,
        updateRegistrationData,
        resetRegistrationData,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};

