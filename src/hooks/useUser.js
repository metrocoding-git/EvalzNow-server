import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { API_ROUTES } from "@/lib/apiRoutes";

export default function useUser() {
  const { data, error, isLoading } = useSWR(API_ROUTES.USERS, fetcher);

  return {
    users: data,
    isLoading,
    isError: error,
  };
}