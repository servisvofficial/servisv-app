import { createContext } from "react";

/** Context ref para estado de chat (tipo definido en useChat para evitar ciclo). */
export const ChatContext = createContext<unknown>(null);
