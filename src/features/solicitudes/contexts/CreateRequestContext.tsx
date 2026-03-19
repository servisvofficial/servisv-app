import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CreateRequestData {
  title: string;
  description: string;
  serviceCategory: string;
  subcategory?: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  scheduledDate?: string;
  preferredTime?: string;
  photos?: string[];
  preferredProviders?: string[];
}

interface CreateRequestContextType {
  requestData: CreateRequestData;
  updateRequestData: (data: Partial<CreateRequestData>) => void;
  resetRequestData: () => void;
}

const initialData: CreateRequestData = {
  title: '',
  description: '',
  serviceCategory: '',
  subcategory: undefined,
  location: '',
  coordinates: undefined,
  scheduledDate: undefined,
  preferredTime: undefined,
  photos: [],
  preferredProviders: [],
};

const CreateRequestContext = createContext<CreateRequestContextType | undefined>(undefined);

export const CreateRequestProvider = ({ children }: { children: ReactNode }) => {
  const [requestData, setRequestData] = useState<CreateRequestData>(initialData);

  const updateRequestData = (data: Partial<CreateRequestData>) => {
    setRequestData(prev => ({ ...prev, ...data }));
  };

  const resetRequestData = () => {
    setRequestData(initialData);
  };

  return (
    <CreateRequestContext.Provider
      value={{
        requestData,
        updateRequestData,
        resetRequestData,
      }}
    >
      {children}
    </CreateRequestContext.Provider>
  );
};

export const useCreateRequest = () => {
  const context = useContext(CreateRequestContext);
  if (context === undefined) {
    throw new Error('useCreateRequest must be used within a CreateRequestProvider');
  }
  return context;
};
