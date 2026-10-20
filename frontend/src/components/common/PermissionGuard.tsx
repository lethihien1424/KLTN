//D:\KLTN\KLTN\frontend\src\components\common\PermissionGuard.tsx
import type { ReactNode } from "react";
import { useAuth } from "../../auth/AuthContext";

export default function PermissionGuard({
  permission,
  children,
  fallback = null,
}: {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return useAuth().can(permission) ? <>{children}</> : <>{fallback}</>;
}
