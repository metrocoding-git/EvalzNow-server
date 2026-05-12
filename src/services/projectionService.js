import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Create new unit
export const createProjection = async (projectionData) => {
  try {
    const response = await api.post(API_ROUTES.PROJECTION, projectionData);
    return response.data;
  } catch (error) {
    console.error("Error creating unit:", error);
    throw error;
  }
};

// Update projection points for existing session
export const updateProjection = async (sessionId, projectionData) => {
  try {
    const response = await api.put(`${API_ROUTES.PROJECTION}/${sessionId}/points`, projectionData);
    return response.data;
  } catch (error) {
    console.error("Error updating projection:", error);
    throw error;
  }
};
  
// Delete unit


// Get all units
export const getProjection = async (unitId, candidateId) => {
  try {
    const response = await api.get(`${API_ROUTES.PROJECTION}/unit/${unitId}/candidate/${candidateId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching units:", error);
    throw error;
  }
};

// Get unit by ID
export const getUnitById = async (id) => {
  try {
    const response = await api.get(`${API_ROUTES.UNIT}/id/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching unit:", error);
    throw error;
  }
};

// Get unit benchmarks


// Create benchmark for unit


// Update benchmark

// Delete benchmark
