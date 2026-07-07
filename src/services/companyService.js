import { API_ROUTES } from "@/lib/apiRoutes";
import api from "@/lib/axiosClient";

export const getCompanySize = async () => {
    try {
        const response = await api.get(API_ROUTES.COMPANYSIZE);
        return response.data;
      } catch (error) {
        console.error("Error fetching clients:", error);
        throw error; // Re-throw for components to handle
      }
};