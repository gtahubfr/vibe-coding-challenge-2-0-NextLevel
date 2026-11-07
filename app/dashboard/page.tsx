import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const instant = false;

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  redirect(`/dashboard/${session.role}`);
}
