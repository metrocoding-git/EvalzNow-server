import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { API_ROUTES } from "@/lib/apiRoutes";

export default function useUnitRoster() {
  const { data, error, isLoading } = useSWR(API_ROUTES.ROSTER, fetcher);

  return {
    roster: data,
    isLoading,
    isError: error,
  };
}