import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Get insert scores by unit ID


export const getUnitAndCandidateSummary = async (filters) => {
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          params[key] = value;
        }
      });
  
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`${API_ROUTES.TABULATION}/proficiency?${query}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching scoring criteria:", error);
      throw error;
    }
};

export const getUnitAndMultipleCandidateSummary = async (filters) => {
  try {
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        params[key] = value;
      }
    });

    const query = new URLSearchParams(params).toString();
    const response = await api.get(`${API_ROUTES.TABULATION}/proficiency?${query}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching scoring criteria:", error);
    throw error;
  }
};