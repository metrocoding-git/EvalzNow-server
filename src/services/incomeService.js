// services/incomeService.js
import api from "@/lib/axiosClient";
import { API_ROUTES } from "@/lib/apiRoutes";

// Create new Income
export const createIncome = async (incomeData) => {
  try {
    const response = await api.post(API_ROUTES.INCOME, incomeData);
    return response.data;
  } catch (error) {
    console.error("Error creating income:", error);
    throw error;
  }
};

// Update Income
export const updateIncome = async (id, incomeData) => {
  try {
    const response = await api.put(`${API_ROUTES.INCOME}/${id}`, incomeData);
    return response.data;
  } catch (error) {
    console.error("Error updating income:", error);
    throw error;
  }
};

// Delete Income
export const deleteIncome = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.INCOME}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting income:", error);
    throw error;
  }
};

// Get all Incomes
export const getAllIncomes = async (clientId) => {
  try {
    const response = await api.get(`${API_ROUTES.INCOME}/${clientId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching incomes:", error);
    throw error;
  }
};

// Get single Income by ID
export const getIncomeById = async (id) => {
  try {
    const response = await api.get(`${API_ROUTES.INCOME}/id/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching income:", error);
    throw error;
  }
};
