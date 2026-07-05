"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ListingsQuery } from "@rentlegal/core";
import { apiGet, apiPost } from "./api-client";
import type { AppUser, PropertyRow, AgreementRow, InstallmentRow } from "./types";

export const useMe = () =>
  useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<{ user: AppUser }>("/api/auth/me").then((d) => d.user),
    retry: false,
  });

const listingsUrl = (filters: Partial<ListingsQuery>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    const str = String(value);
    if (str) params.set(key, str);
  }
  const qs = params.toString();
  return qs ? `/api/listings?${qs}` : "/api/listings";
};

export const useListings = (filters: Partial<ListingsQuery>) =>
  useQuery({
    queryKey: ["listings", filters],
    queryFn: () => apiGet<{ items: PropertyRow[] }>(listingsUrl(filters)).then((d) => d.items),
  });

export const useListing = (id: string) =>
  useQuery({
    queryKey: ["listing", id],
    queryFn: () => apiGet<{ item: PropertyRow }>(`/api/listings/${id}`).then((d) => d.item),
  });

export const useFavorites = () =>
  useQuery({
    queryKey: ["favorites"],
    queryFn: () => apiGet<{ items: PropertyRow[] }>("/api/favorites").then((d) => d.items),
  });

export const useToggleFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) =>
      apiPost<{ liked: boolean }>("/api/favorites", { propertyId }),
    onMutate: async (propertyId) => {
      // optimistic: перевернуть isLiked во всех кэшах лент
      await qc.cancelQueries({ queryKey: ["listings"] });
      qc.setQueriesData<PropertyRow[]>({ queryKey: ["listings"] }, (old) =>
        old?.map((p) => (p.id === propertyId ? { ...p, isLiked: !p.isLiked } : p)),
      );
      qc.setQueriesData<PropertyRow>({ queryKey: ["listing"] }, (old) =>
        old && old.id === propertyId ? { ...old, isLiked: !old.isLiked } : old,
      );
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["listings"] });
      void qc.invalidateQueries({ queryKey: ["listing"] });
      void qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
};

export const useMyProperties = () =>
  useQuery({
    queryKey: ["my-properties"],
    queryFn: () => apiGet<{ items: PropertyRow[] }>("/api/properties").then((d) => d.items),
  });

export type OwnedProperty = {
  item: PropertyRow;
  agreement:
    | (AgreementRow & { tenant: AppUser | null; installments: InstallmentRow[] })
    | null;
};

export const useOwnedProperty = (id: string) =>
  useQuery({
    queryKey: ["owned-property", id],
    queryFn: () => apiGet<OwnedProperty>(`/api/properties/${id}`),
  });

export const useMyAgreements = () =>
  useQuery({
    queryKey: ["my-agreements"],
    queryFn: () =>
      apiGet<{
        items: (AgreementRow & { property: PropertyRow; installments: InstallmentRow[] })[];
      }>("/api/agreements").then((d) => d.items),
  });
