import { MockDashboardApi } from "@/lib/api/adapters/mock";
import { RestDashboardApi } from "@/lib/api/adapters/rest";
import type { DashboardApi } from "@/lib/api/dashboard-api";

let singleton: DashboardApi | null = null;

export function getDashboardApi(): DashboardApi {
  if (!singleton) {
    singleton = process.env.NEXT_PUBLIC_API_BASE_URL
      ? new RestDashboardApi()
      : new MockDashboardApi();
  }
  return singleton;
}
