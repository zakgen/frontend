"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";

import { getDashboardApi } from "@/lib/api";
import { queryKeys } from "@/lib/api/query-keys";
import type { BusinessSummary, MyBusinessesResponse } from "@/lib/types";

type BusinessContextValue = {
  businesses: BusinessSummary[];
  currentBusiness: BusinessSummary | null;
  currentBusinessId: number | null;
  isLoading: boolean;
  isUnauthorized: boolean;
  errorMessage: string | null;
  refreshBusinesses: () => Promise<MyBusinessesResponse | undefined>;
  setCurrentBusinessId: (businessId: number | null) => void;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);

const api = getDashboardApi();

function pickCurrentBusinessId(
  data: MyBusinessesResponse | undefined,
  fallback: number | null,
) {
  if (fallback) {
    return fallback;
  }

  return data?.current_business_id ?? data?.businesses[0]?.id ?? null;
}

export function BusinessProvider({
  children,
  initialData,
  initialCurrentBusinessId = null,
}: Readonly<{
  children: React.ReactNode;
  initialData?: MyBusinessesResponse;
  initialCurrentBusinessId?: number | null;
}>) {
  const [currentBusinessId, setCurrentBusinessId] = useState<number | null>(
    pickCurrentBusinessId(initialData, initialCurrentBusinessId),
  );

  const businessesQuery = useQuery({
    queryKey: queryKeys.myBusinesses(),
    queryFn: () => api.getMyBusinesses(),
    initialData,
  });

  useEffect(() => {
    const nextBusinessId = pickCurrentBusinessId(
      businessesQuery.data,
      initialCurrentBusinessId,
    );

    setCurrentBusinessId((previous) => {
      if (
        previous &&
        businessesQuery.data?.businesses.some((business) => business.id === previous)
      ) {
        return previous;
      }

      return nextBusinessId;
    });
  }, [businessesQuery.data, initialCurrentBusinessId]);

  const value = useMemo<BusinessContextValue>(() => {
    const businesses = businessesQuery.data?.businesses ?? [];
    const currentBusiness =
      businesses.find((business) => business.id === currentBusinessId) ?? null;

    return {
      businesses,
      currentBusiness,
      currentBusinessId,
      isLoading: businessesQuery.isLoading,
      isUnauthorized:
        businessesQuery.error instanceof Error &&
        businessesQuery.error.message.toLowerCase().includes("auth"),
      errorMessage:
        businessesQuery.error instanceof Error ? businessesQuery.error.message : null,
      refreshBusinesses: async () => (await businessesQuery.refetch()).data,
      setCurrentBusinessId,
    };
  }, [businessesQuery, currentBusinessId]);

  return (
    <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const context = useContext(BusinessContext);

  if (!context) {
    throw new Error("useBusinessContext must be used within a BusinessProvider.");
  }

  return context;
}
