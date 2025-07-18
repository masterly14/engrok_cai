import { redirect } from "next/navigation";
import { RestrictedAccessPage } from "@/components/application/restricted-access-page";
import { getUserSubscription } from "@/actions/user";

interface PageProps {
  searchParams?: Record<string, string | string[]>;
}

export default async function ApplicationHome({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const resolvedSearchParams = await searchParams;
  // If user was redirected here due to lack of voice feature, show friendly page
  if (resolvedSearchParams?.["no-access"] === "voice") {
    const { currentPlan } = await getUserSubscription();
    return <RestrictedAccessPage planName={currentPlan} />;
  }

  // Otherwise, enviamos al dashboard principal de la aplicación
  redirect("/application/dashboard");
}
