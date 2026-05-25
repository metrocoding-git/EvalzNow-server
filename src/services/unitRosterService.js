import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Create new unit
export const createUnitRoster = async (rosterData) => {
  try {
    const response = await api.post(API_ROUTES.ROSTER, rosterData);
    return response.data;
  } catch (error) {
    console.error("Error creating unit:", error);
    throw error;
  }
};

// Update unit
export const updateUnitRoster = async (id, rosterData) => {
  try {
    const response = await api.put(`${API_ROUTES.ROSTER}/${id}`, rosterData);
    return response.data;
  } catch (error) {
    console.error("Error updating unit:", error);
    throw error;
  }
};

// Delete unit
export const deleteUnitRoster = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.ROSTER}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting unit:", error);
    throw error;
  }
};

// Get all units
export const getAllUnitRoster = async () => {
  try {
    const response = await api.get(API_ROUTES.ROSTER);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching units:", error);
    throw error;
  }
};



// Get unit by ID
export const getUniRostertByUnitId = async (id) => {
  try {
    const response = await api.get(`${API_ROUTES.ROSTER}/unit/${id}`);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching unit:", error);
    throw error;
  }
};


// Get unit by CandidateID
export const getUnitByCandidateId = async (id) => {
  try {
    const response = await api.get(`${API_ROUTES.ROSTER}/candidate/${id}`);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching unit:", error);
    throw error;
  }
};