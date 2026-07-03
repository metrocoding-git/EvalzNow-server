import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { API_ROUTES } from "@/lib/apiRoutes";

export default function useAssessmentBlockManager() {
  const { data, error, isLoading } = useSWR(API_ROUTES.ASSESSMENTMANAGER, fetcher);

  return {
    assessment: data,
    isLoading,
    isError: error,
  };
}