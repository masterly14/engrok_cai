import { onBoardUser } from "@/actions/user";
import { redirect } from "next/navigation";

const page = async () => {
  const user = await onBoardUser();
  if (user?.status === 201 || user?.status === 200) {
    return redirect("/application/dashboard")
  }
  return redirect("/sign-in");
};

export default page;
