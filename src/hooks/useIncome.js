import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { API_ROUTES } from "@/lib/apiRoutes";

export default function useIncome() {
  const { data, error, isLoading } = useSWR(API_ROUTES.INCOME, fetcher);

  return {
    income: data,
    isLoading,
    isError: error,
  };
}