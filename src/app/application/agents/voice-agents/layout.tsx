
import { getUserSubscription } from "@/actions/user";
import { redirect } from "next/navigation";

export default async function VoiceAgentsLayout({ children }: { children: React.ReactNode }) {
  const { restrictions } = await getUserSubscription();
  if (!restrictions.features?.includes("voice")) {
    redirect("/application?no-access=voice");
  }
  return <>{children}</>;
}