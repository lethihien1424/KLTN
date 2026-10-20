//D:\KLTN\KLTN\frontend\src\routes\ProtectedRoute.tsx
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { EmptyState } from "../components/common/PurchaseUI";
export default function ProtectedRoute({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { can } = useAuth();
  return can(permission) ? (
    <>{children}</>
  ) : (
    <EmptyState
      title="Bạn chưa có quyền truy cập màn hình này"
      description="Liên hệ quản trị viên để được cấp quyền phù hợp."
    />
  );
}

