"use client";
import { createContext, useContext } from "react";

export const FormStatusContext = createContext({
  formStatus: "Ready...",
  setFormStatus: () => {},
});

export const useFormStatus = () => useContext(FormStatusContext);
