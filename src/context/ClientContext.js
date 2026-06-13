"use client";
import { createContext, useContext, useState } from "react";

const ClientContext = createContext();

export function ClientProvider({ children }) {
  const [activeClientId, setActiveClientId] = useState(null);

  return (
    <ClientContext.Provider value={{ activeClientId, setActiveClientId }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  return useContext(ClientContext);
}
