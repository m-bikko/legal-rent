"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppUser } from "@/lib/types";

const UserContext = createContext<AppUser | null>(null);

export const UserProvider = ({ user, children }: { user: AppUser; children: ReactNode }) => (
  <UserContext.Provider value={user}>{children}</UserContext.Provider>
);

/** Текущий пользователь; доступен на всех страницах внутри (app)-шелла. */
export const useUser = (): AppUser => {
  const user = useContext(UserContext);
  if (!user) throw new Error("useUser must be used within UserProvider");
  return user;
};
