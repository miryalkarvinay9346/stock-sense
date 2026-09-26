import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  const session = getSessionFromCookies();

  if (!session) {
    redirect("/login?redirect=/dashboard");
  }

  return <DashboardClient user={session} />;
}
