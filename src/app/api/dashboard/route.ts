import { withApi } from "@/server/api";
import { dashboardSummary } from "@/server/services/reports";

export const GET = withApi(({ ctx }) => dashboardSummary(ctx));
