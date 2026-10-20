//D:\KLTN\KLTN\frontend\src\auth\AuthContext.tsx
import { createContext, useContext } from "react";
import type { User } from "../services/authService";
import { hasPermission } from "./permissions";

export type AuthState = { user: User; refreshPermissions: () => Promise<void> };
export const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext is required.");
  return {
    ...context,
    can: (permission: string) =>
      hasPermission(context.user.permissions, permission),
  };
}
