import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Get all insert scores
export const getInsertScores = async () => {
  try {
    const response = await api.get(API_ROUTES.INSERT_SCORE);
    return response.data;
  } catch (error) {
    console.error("Error fetching insert scores:", error);
    throw error;
  }
};

// Get insert scores by unit ID
export const getInsertScoresByUnitId = async (unitId) => {
  try {
    const response = await api.get(`${API_ROUTES.INSERT_SCORE}/unit/${unitId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching insert scores for unit ${unitId}:`, error);
    throw error;
  }
};

// Get insert scores by block ID
export const getInsertScoresByBlockId = async (blockId) => {
  try {
    const response = await api.get(`${API_ROUTES.INSERT_SCORE}/block/${blockId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching insert scores for block ${blockId}:`, error);
    throw error;
  }
};

// Create a new insert score
export const createInsertScore = async (scoreData) => {
  try {
    const response = await api.post(API_ROUTES.INSERT_SCORE, scoreData);
    return response.data;
  } catch (error) {
    console.error("Error creating insert score:", error);
    throw error;
  }
};

// Update insert score
export const updateInsertScore = async (id, scoreData) => {
  try {
    const response = await api.put(`${API_ROUTES.INSERT_SCORE}/${id}`, scoreData);
    return response.data;
  } catch (error) {
    console.error("Error updating insert score:", error);
    throw error;
  }
};

// Delete insert score
export const deleteInsertScore = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.INSERT_SCORE}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting insert score:", error);
    throw error;
  }
};


// Get assessment block by Unit ID and Candidate ID
export const getInsertScoreByUnitAndCandidate = async (unitId, candidateId) => {
    try {
      const response = await api.get(
        `${API_ROUTES.INSERT_SCORE}/unit/${unitId}/candidate/${candidateId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching assessment block by unit and candidate:", error);
      throw error;
    }
  };


  // Get insert scores by pp id summary
export const getPpIdSummary = async (unitId, candidate_id) => {
  try {
    const response = await api.get(`${API_ROUTES.INSERT_SCORE}/summary?unitId=${unitId}&candidate_id=${candidate_id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching PP summary for unitId=${unitId}, candidate_id=${candidate_id}:`,
      error
    );
    throw error;
  }
};

export const getCriticalRefbyPpId = async (ppId, unitId, candidate_id) => {
  try {
    const response = await api.get(`${API_ROUTES.INSERT_SCORE}/critical-range/${ppId}/${unitId}/${candidate_id}`);
    return response.data;
  } catch (error) {
    console.error(
      `Error fetching critical reference range for unitId=${unitId}, candidate_id=${candidate_id}:`,
      error
    );
    throw error;
  }
};



  // Get insert scores by pp id summary
  export const getScoreByUnitGroup = async (unitId) => {
    try {
      const response = await api.get(`${API_ROUTES.INSERT_SCORE}/insert/unit/${unitId}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching master pp id bun totals for unitId=${unitId}:`,
        error
      );
      throw error;
    }
  };