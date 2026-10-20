// Keep existing URLs working while exposing the full purchase route names.
//D:\KLTN\KLTN\frontend\src\routes\purchasePaths.ts
const purchasePaths = [
  ["/nhu-cau", "/nhu-cau-nguyen-lieu"],
  ["/de-xuat", "/de-xuat-nhap-hang"],
  ["/don-mua", "/don-mua-nguyen-lieu"],
] as const;

export function canonicalPurchasePath(path: string): string {
  for (const [existing, canonical] of purchasePaths) {
    if (path === existing || path.startsWith(`${existing}/`))
      return canonical + path.slice(existing.length);
  }
  return path;
}

export function resolvePurchasePath(path: string): string {
  for (const [existing, canonical] of purchasePaths) {
    if (path === canonical || path.startsWith(`${canonical}/`))
      return existing + path.slice(canonical.length);
  }
  return path;
}
