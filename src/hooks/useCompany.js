import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { API_ROUTES } from "@/lib/apiRoutes";

export default function useCompany() {
  const { data, error, isLoading } = useSWR(API_ROUTES.COMPANYSIZE, fetcher);

  return {
    companySize: data,
    isLoading,
    isError: error,
  };
}