import { MockDashboardApi } from "@/lib/api/adapters/mock";
import type { DashboardApi } from "@/lib/api/dashboard-api";

let singleton: DashboardApi | null = null;

export function getDashboardApi() {
  if (!singleton) singleton = new MockDashboardApi();
  return singleton;
}
