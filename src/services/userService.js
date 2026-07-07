import api from "@/lib/api";
import { API_ROUTES } from "@/lib/apiRoutes";

export const loginUser = async (email, password) => {
  return await api.post(API_ROUTES.LOGIN, { email, password });
};

export const getAllUsers = async () => {
  return await api.get(API_ROUTES.USERS);
};