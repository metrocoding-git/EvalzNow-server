import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Create new assessment block
export const createAssessmentBlock = async (blockData) => {
  try {
    const response = await api.post(API_ROUTES.ASSESSMENTMANAGER, blockData);
    console.log("block data: ", blockData);
    return response.data;
  } catch (error) {
    console.error("Error creating assessment block:", error);
    throw error;
  }
};

// Create new assessment block
export const createDuplicateAssessmentBlock = async (blockData) => {
  try {
    const response = await api.post(`${API_ROUTES.ASSESSMENTMANAGER}/duplicate`, blockData);
    console.log("block data: ", blockData);
    return response.data;
  } catch (error) {
    console.error("Error creating assessment block:", error);
    throw error;
  }
};

// Update assessment block
export const updateAssessmentBlock = async (id, blockData) => {
  try {
    const response = await api.put(`${API_ROUTES.ASSESSMENTMANAGER}/${id}`, blockData);
    return response.data;
  } catch (error) {
    console.error("Error updating assessment block:", error);
    throw error;
  }
};

// Delete assessment block
export const deleteAssessmentBlock = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.ASSESSMENTMANAGER}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting assessment block:", error);
    throw error;
  }
};

// Get all assessment blocks
export const getAllAssessmentBlocks = async () => {
  try {
    const response = await api.get(API_ROUTES.ASSESSMENTMANAGER);
    return response.data;
  } catch (error) {
    console.error("Error fetching assessment blocks:", error);
    throw error;
  }
};

// Get assessment block by ID
export const getAssessmentBlockById = async (id) => {
  try {
    const response = await api.get(`${API_ROUTES.ASSESSMENTMANAGER}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching assessment block:", error);
    throw error;
  }
};


// Get assessment block by ID
export const getAssessmentBlockByUnitId = async (id) => {
    try {
      const response = await api.get(`${API_ROUTES.ASSESSMENTMANAGER}/unit/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching assessment block:", error);
      throw error;
    }
};

// Get assessment block by Unit ID and Candidate ID
export const getAssessmentBlockByUnitAndCandidate = async (unitId, candidateId) => {
  try {
    const response = await api.get(
      `${API_ROUTES.ASSESSMENTMANAGER}/unit/${unitId}/candidate/${candidateId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching assessment block by unit and candidate:", error);
    throw error;
  }
};

