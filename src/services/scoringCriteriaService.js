import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Get all scoring criteria
export const getScoringCriteria = async () => {
  try {
    const response = await api.get(API_ROUTES.SCORING_CRITERIA);
    return response.data;
  } catch (error) {
    console.error("Error fetching scoring criteria:", error);
    throw error;
  }
};

// Get scoring criteria by unit ID
export const getScoringCriteriaByUnitId = async (unitId) => {
  try {
    const response = await api.get(`${API_ROUTES.SCORING_CRITERIA}/unit/${unitId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching scoring criteria for unit ${unitId}:`, error);
    throw error;
  }
};



// Create a new scoring criteria
export const createScoringCriteria = async (criteriaData) => {
  try {
    const response = await api.post(API_ROUTES.SCORING_CRITERIA, criteriaData);
    return response.data;
  } catch (error) {
    console.error("Error creating scoring criteria:", error);
    throw error;
  }
};

// Update scoring criteria
export const updateScoringCriteria = async (id, criteriaData) => {
  try {
    const response = await api.put(`${API_ROUTES.SCORING_CRITERIA}/${id}`, criteriaData);
    return response.data;
  } catch (error) {
    console.error("Error updating scoring criteria:", error);
    throw error;
  }
};

// Delete scoring criteria
export const deleteScoringCriteria = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.SCORING_CRITERIA}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting scoring criteria:", error);
    throw error;
  }
};


