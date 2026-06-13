import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Get insert scores by unit ID
export const getScoringTrendsSummary = async (filters) => {
    try {
      // Remove undefined or empty filters
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          params[key] = value;
        }
      });
  
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`${API_ROUTES.SCORING_TRENDS}/se?${query}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching scoring trends:", error);
      throw error;
    }
  };


  // Get max scores by unit ID
export const getMaxScoresSummary = async (filters) => {
    try {
      // Remove undefined or empty filters
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          params[key] = value;
        }
      });
  
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`${API_ROUTES.SCORING_TRENDS}/max-score?${query}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching scoring trends:", error);
      throw error;
    }
  };


  // Get attained scores by unit ID
export const getAttainedScoreSummary = async (filters) => {
    try {
      // Remove undefined or empty filters
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== null) {
          params[key] = value;
        }
      });
  
      const query = new URLSearchParams(params).toString();
      const response = await api.get(`${API_ROUTES.SCORING_TRENDS}/attained-score?${query}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching scoring trends:", error);
      throw error;
    }
  };