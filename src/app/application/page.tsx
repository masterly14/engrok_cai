import { redirect } from "next/navigation";
import { RestrictedAccessPage } from "@/components/application/restricted-access-page";
import { getUserSubscription } from "@/actions/user";

interface PageProps {
  searchParams?: Record<string, string | string[]>;
}

export default async function ApplicationHome({ searchParams }: PageProps) {
  // If user was redirected here due to lack of voice feature, show friendly page
  if (searchParams?.["no-access"] === "voice") {
    const { currentPlan } = await getUserSubscription();
    return <RestrictedAccessPage planName={currentPlan} />;
  }

  // Otherwise, enviamos al dashboard principal de la aplicación
  redirect("/application/dashboard");
}
