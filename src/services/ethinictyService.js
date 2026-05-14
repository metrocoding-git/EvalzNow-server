// import api from "@/lib/api";
import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Create new ethinicity
export const createEthinicity = async (ethinicityData) => {
  try {
    const response = await api.post(API_ROUTES.ETHINICITY, ethinicityData);
    return response.data;
  } catch (error) {
    console.error("Error creating ethinicity:", error);
    throw error;
  }
};

// Update ethinicity
export const updateEthinicity = async (id, ethinicityData) => {
  try {
    const response = await api.put(`${API_ROUTES.ETHINICITY}/${id}`, ethinicityData);
    return response.data;
  } catch (error) {
    console.error("Error updating ethinicity:", error);
    throw error;
  }
};

// Delete ethinicity
export const deleteEthinicity = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.ETHINICITY}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting ethinicity:", error);
    throw error;
  }
};

// Get all ethinicities
export const getAllEthinicities = async (clientId) => {
  try {
    const response = await api.get(`${API_ROUTES.ETHINICITY}/${clientId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ethinicities:", error);
    throw error; // Re-throw for components to handle
  }
};

// Get single ethinicity by ID
export const getEthinicityById = async (id) => {
  try {
    const response = await api.get(`${API_ROUTES.ETHINICITY}/id/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching ethinicity:", error);
    throw error;
  }
};
