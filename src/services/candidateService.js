import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Create new candidate
export const createCandidate = async (candidateData) => {
  try {
    const response = await api.post(API_ROUTES.CANDIDATE, candidateData);
    return response.data;
  } catch (error) {
    console.error("Error creating candidate:", error);
    throw error;
  }
};

// Update candidate
export const updateCandidate = async (id, candidateData) => {
  try {
    const response = await api.put(`${API_ROUTES.CANDIDATE}/${id}`, candidateData);
    return response.data;
  } catch (error) {
    console.error("Error updating candidate:", error);
    throw error;
  }
};

// Delete candidate
export const deleteCandidate = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.CANDIDATE}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting candidate:", error);
    throw error;
  }
};

// Get all candidates
export const getAllCandidates = async (clientId) => {
  try {
    const response = await api.get(`${API_ROUTES.CANDIDATE}/${clientId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }
};

// Get all ethnicities
export const getAllCandidateEthinicities = async (clientId) => {
  try {
    const response = await api.get(`${API_ROUTES.CANDIDATE}/ethnicities/${clientId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }
};


// Get all incomes
export const getAllCandidateIncomes = async (clientId) => {
  try {
    const response = await api.get(`${API_ROUTES.CANDIDATE}/incomes/${clientId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    throw error;
  }
};

// Get candidate by ID
export const getCandidateById = async (id) => {
  try {
    const response = await api.get(`${API_ROUTES.CANDIDATE}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching candidate:", error);
    throw error;
  }
};