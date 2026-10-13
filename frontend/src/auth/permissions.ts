export function hasPermission(
  permissions: readonly string[] | undefined,
  permission: string,
): boolean {
  return permissions?.includes(permission) ?? false;
}

export function hasAllPermissions(
  permissions: readonly string[] | undefined,
  required: readonly string[],
): boolean {
  return required.every((permission) => hasPermission(permissions, permission));
}
