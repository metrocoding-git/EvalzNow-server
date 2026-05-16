// import api from "@/lib/api";
import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

// Create new Benchmark
export const createBenchmark = async (benchmarkData) => {
  try {
    const response = await api.post(API_ROUTES.BENCHMARK, benchmarkData);
    return response.data;
  } catch (error) {
    console.error("Error creating Benchmark:", error);
    throw error;
  }
};

// Update Benchmark
export const updateBenchmark = async (id, BenchmarkData) => {
  try {
    const response = await api.put(`${API_ROUTES.BENCHMARK}/${id}`, BenchmarkData);
    return response.data;
  } catch (error) {
    console.error("Error updating Benchmark:", error);
    throw error;
  }
};

// Delete Benchmark
export const deleteBenchmark = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.BENCHMARK}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting Benchmark:", error);
    throw error;
  }
};

// Get all ethinicities
export const getAllEthinicities = async () => {
  try {
    const response = await api.get(API_ROUTES.BENCHMARK);
    return response.data;
  } catch (error) {
    console.error("Error fetching ethinicities:", error);
    throw error; // Re-throw for components to handle
  }
};

// Get single Benchmark by ID
export const getBenchmarkById = async (id) => {
  try {
    const response = await api.get(`${API_ROUTES.BENCHMARK}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching Benchmark:", error);
    throw error;
  }
};
