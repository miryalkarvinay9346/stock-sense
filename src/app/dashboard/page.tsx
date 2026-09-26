import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  const s = getSessionFromCookies();
// session for making sure that user stay for the time assinged for him
  if (!s) {
    redirect("/login?redirect=/dashboard");
  }

  return <DashboardClient user={s} />;
}
