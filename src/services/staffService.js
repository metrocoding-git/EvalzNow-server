// import api from "@/lib/api";
import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";


// Create new client
export const createStaff = async (staffData) => {
  try {
    const response = await api.post(API_ROUTES.STAFFS, staffData);
    return response.data;
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
};

// Update client
export const updateStaff = async (id, staffData) => {
  try {
    const response = await api.put(`${API_ROUTES.STAFFS}/${id}`, staffData);
    return response.data;
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

// Delete client
export const deleteStaff = async (id) => {
  try {
    const response = await api.delete(`${API_ROUTES.STAFFS}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};

export const getAllStaffs = async (clientId) => {
    try {
        const response = await api.get(`${API_ROUTES.STAFFS}/${clientId}`);
        return response.data;
      } catch (error) {
        console.error("Error fetching clients:", error);
        throw error; // Re-throw for components to handle
      }
};


export const getStaffById = async (staffId) => {
  try {
      const response = await api.get(`${API_ROUTES.STAFFS}/id/${staffId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching clients:", error);
      throw error; // Re-throw for components to handle
    }
};


