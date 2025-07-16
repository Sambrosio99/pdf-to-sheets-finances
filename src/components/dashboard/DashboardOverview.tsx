
import { EnhancedDashboardOverview } from "./EnhancedDashboardOverview";
import { Transaction } from "@/types/finance";

interface DashboardOverviewProps {
  transactions: Transaction[];
}

export const DashboardOverview = ({ transactions }: DashboardOverviewProps) => {
  return <EnhancedDashboardOverview transactions={transactions} />;
};
