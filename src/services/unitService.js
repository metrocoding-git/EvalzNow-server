import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Create new unit
export const createUnit = async (unitData) => {
  try {
    const response = await api.post(API_ROUTES.UNIT, unitData);
    return response.data;
  } catch (error) {
    console.error("Error creating unit:", error);
    throw error;
  }
};

// Update unit
export const updateUnit = async (id, unitData) => {
  try {
    const response = await api.put(`${API_ROUTES.UNIT}/${id}`, unitData);
    return response.data;
  } catch (error) {
    console.error("Error updating unit:", error);
    throw error;
  }
};

// Delete unit
export const deleteUnit = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.UNIT}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting unit:", error);
    throw error;
  }
};

// Get all units
export const getAllUnits = async (clientId) => {
  try {
    const response = await api.get(`${API_ROUTES.UNIT}/${clientId}`);
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
export const getUnitBenchmarks = async (unitId) => {
  try {
    const response = await api.get(`${API_ROUTES.UNIT}/${unitId}/benchmarks`);
    return response.data;
  } catch (error) {
    console.error("Error fetching unit benchmarks:", error);
    throw error;
  }
};

// Create benchmark for unit
export const createBenchmark = async (unitId, benchmarkData) => {
  try {
    const response = await api.post(
      `${API_ROUTES.UNIT}/${unitId}/benchmarks`,
      benchmarkData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating benchmark:", error);
    throw error;
  }
};

// Update benchmark
export const updateBenchmark = async (unitId, benchmarkId, benchmarkData) => {
  try {
    const response = await api.put(
      `${API_ROUTES.UNIT}/${unitId}/benchmarks/${benchmarkId}`,
      benchmarkData
    );
    return response.data;
  } catch (error) {
    console.error("Error updating benchmark:", error);
    throw error;
  }
};

// Delete benchmark
export const deleteBenchmark = async (unitId, benchmarkId) => {
  try {
    const response = await api.delete(
      `${API_ROUTES.UNIT}/${unitId}/benchmarks/${benchmarkId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting benchmark:", error);
    throw error;
  }
};