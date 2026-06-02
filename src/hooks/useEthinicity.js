import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { API_ROUTES } from "@/lib/apiRoutes";

export default function useEthinicity() {
  const { data, error, isLoading } = useSWR(API_ROUTES.ETHINICITY, fetcher);

  return {
    ethinicity: data,
    isLoading,
    isError: error,
  };
}