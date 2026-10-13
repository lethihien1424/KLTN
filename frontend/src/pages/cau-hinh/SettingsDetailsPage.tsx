import { reasonFunctions } from "../../services/reasonService";
import { useState } from "react";
import { api, jsonBody } from "../../services/apiClient";
import { useAuth } from "../../auth/AuthContext";
import DataTable from "../../components/common/DataTable";
import {
  PageHeader,
  Field,
  Feedback,
  LoadingState,
  ErrorState,
  useResource,
  useMutation,
  formatDate,
} from "../../components/common/PurchaseUI";
import { SettingsBreadcrumb } from "./SettingsPage";
type Role = { ma_vai_tro: string; ten_vai_tro: string; permissions?: string[] };
type Permission = { ma_quyen: string; ten_quyen: string };
export function RolesSettingsPage() {
  const { can } = useAuth();
  const roles = useResource(() => api<Role[]>("/roles"));
  const [selected, setSelected] = useState("");
  const detail = useResource(
    () =>
      selected
        ? api<Role>("/roles/" + encodeURIComponent(selected))
        : Promise.resolve(null),
    [selected],
  );
  const permissions = useResource(
    () =>
      can("PERMISSION_VIEW")
        ? api<Permission[]>("/permissions")
        : Promise.resolve([]),
    [can("PERMISSION_VIEW")],
  );
  const [draft, setDraft] = useState<string[] | null>(null);
  const mutation = useMutation();
  const values = draft ?? detail.data?.permissions ?? [];
  return (
    <>
      <SettingsBreadcrumb title="Vai trò & phân quyền" />
      <PageHeader
        title="Vai trò & phân quyền"
        description="Quản lý thông tin cấu hình hệ thống."
      />
      {roles.loading ? (
        <LoadingState />
      ) : roles.error ? (
        <ErrorState message={roles.error} retry={roles.refetch} />
      ) : (
        <section className="pm-panel">
          <Field label="Vai trò">
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setDraft(null);
                mutation.setError("");
              }}
            >
              <option value="">Chọn vai trò</option>
              {roles.data?.map((r) => (
                <option key={r.ma_vai_tro} value={r.ma_vai_tro}>
                  {r.ten_vai_tro}
                </option>
              ))}
            </select>
          </Field>
          {detail.loading ? (
            <LoadingState />
          ) : detail.error ? (
            <ErrorState message={detail.error} retry={detail.refetch} />
          ) : (
            selected && (
              <>
                <p>
                  Quyền hiện tại:{" "}
                  {detail.data?.permissions?.join(", ") || "Chưa có quyền"}
                </p>
                {permissions.error && (
                  <ErrorState
                    message={permissions.error}
                    retry={permissions.refetch}
                  />
                )}
                <div className="pm-form-grid">
                  {permissions.data?.map((p) => (
                    <label key={p.ma_quyen}>
                      <input
                        type="checkbox"
                        disabled={!can("ROLE_ASSIGN_PERMISSION")}
                        checked={values.includes(p.ma_quyen)}
                        onChange={(e) =>
                          setDraft(
                            e.target.checked
                              ? [...values, p.ma_quyen]
                              : values.filter((v) => v !== p.ma_quyen),
                          )
                        }
                      />
                      {p.ten_quyen}
                    </label>
                  ))}
                </div>
                {can("ROLE_ASSIGN_PERMISSION") && can("PERMISSION_VIEW") && (
                  <button
                    className="pm-btn primary"
                    disabled={
                      mutation.busy ||
                      permissions.loading ||
                      Boolean(permissions.error) ||
                      detail.loading
                    }
                    onClick={() =>
                      void mutation.run(async () => {
                        if (!can("ROLE_ASSIGN_PERMISSION")) return;
                        await api(
                          "/roles/" +
                            encodeURIComponent(selected) +
                            "/permissions",
                          {
                            method: "PUT",
                            body: jsonBody({ permissions: values }),
                          },
                        );
                        setDraft(null);
                        detail.refetch();
                      }, "Đã lưu phân quyền.")
                    }
                  >
                    Lưu phân quyền
                  </button>
                )}
                <Feedback error={mutation.error} success={mutation.success} />
              </>
            )
          )}
        </section>
      )}
    </>
  );
}
export function GeneralSettingsPage() {
  return (
    <>
      <SettingsBreadcrumb title="Cấu hình chung" />
      <PageHeader
        title="Cấu hình chung"
        description="Quản lý thông tin cấu hình hệ thống."
      />
      <section className="pm-panel">
        <h2>Milano Coffee</h2>
        <p>Hệ thống dự báo nhu cầu mua nguyên liệu.</p>
        <p>Các lý do nghiệp vụ được quản lý tại Cấu hình → Quản lý lý do.</p>
      </section>
    </>
  );
}
