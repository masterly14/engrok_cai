import CrmDashboard from "@/components/application/crm/crm-dashboard";
import { getAllLeads } from "@/actions/crm";
import DehydratePage from "@/components/dehydratedPages";

export default function CrmPage() {
  return (
    <DehydratePage Querykey={"leads"} Queryfn={getAllLeads}>
      <CrmDashboard />
    </DehydratePage>
  );
}
