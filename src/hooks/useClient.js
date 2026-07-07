import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { API_ROUTES } from "@/lib/apiRoutes";

export default function useClient() {
  const { data, error, isLoading } = useSWR(API_ROUTES.CLIENTS, fetcher);

  return {
    client: data,
    isLoading,
    isError: error,
  };
}