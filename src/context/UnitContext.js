"use client";
import { createContext, useContext, useState } from "react";

const UnitContext = createContext();

export const UnitProvider = ({ children }) => {
  const [selectedUnitId, setSelectedUnitId] = useState(null);

  return (
    <UnitContext.Provider value={{ selectedUnitId, setSelectedUnitId }}>
      {children}
    </UnitContext.Provider>
  );
};

// Custom hook for easier usage
export const useUnit = () => useContext(UnitContext);
