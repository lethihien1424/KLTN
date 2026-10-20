//D:\KLTN\KLTN\frontend\src\routes\navigation.ts
import { useEffect, useState } from "react";

export type Location = { path: string; params: URLSearchParams };
function readLocation(): Location {
  const [path, search = ""] = window.location.hash.replace(/^#/, "").split("?");
  return { path: path || "/", params: new URLSearchParams(search) };
}
export function navigate(path: string, parameters?: Record<string, string>) {
  const search = parameters ? new URLSearchParams(parameters).toString() : "";
  window.location.hash = path + (search ? `?${search}` : "");
}
export function useLocation() {
  const [location, setLocation] = useState(readLocation);
  useEffect(() => {
    const update = () => setLocation(readLocation());
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  return location;
}
