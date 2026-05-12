// import api from "@/lib/api";
import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";


// Create new client
// export const createAccount = async (a) => {
//   try {
//     const response = await api.post(API_ROUTES.ACCOUNT, clientData);
//     return response.data;
//   } catch (error) {
//     console.error("Error creating client:", error);
//     throw error;
//   }
// };

// Update client
// export const updateClient = async (id, clientData) => {
//   try {
//     const response = await api.put(`${API_ROUTES.CLIENTS}/${id}`, clientData);
//     return response.data;
//   } catch (error) {
//     console.error("Error updating client:", error);
//     throw error;
//   }
// };

// Delete client
// export const deleteClient = async (id) => {
//   try {
//     const response = await api.delete(`${API_ROUTES.CLIENTS}/${id}`);
//     return response.data;
//   } catch (error) {
//     console.error("Error deleting client:", error);
//     throw error;
//   }
// };

export const getUser = async () => {
    try {
        const response = await api.get(`${API_ROUTES.ACCOUNT}/me`);
        return response.data;
      } catch (error) {
        console.error("Error fetching clients:", error);
        throw error; // Re-throw for components to handle
      }
};

export const login = async (loginData) => {
    try {
        const response = await api.post(API_ROUTES.ACCOUNT, loginData);
        return response.data;
      } catch (error) {
        console.error("Error fetching clients:", error);
        throw error; // Re-throw for components to handle
      }
};


// Create new client
export const createAccount = async (accData) => {
  try {
    const response = await api.post(`${API_ROUTES.ACCOUNT}/create`, accData);
    return response.data;
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
};


