import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { API_ROUTES } from "@/lib/apiRoutes";

export default function useCandidate() {
  const { data, error, isLoading } = useSWR(API_ROUTES.UNIT, fetcher);

  return {
    unit: data,
    isLoading,
    isError: error,
  };
}