import Dashboard from "@/components/dashboard";
import { createClient } from "@/middlewares/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user == null) {
    redirect('/login');
  }
  return (
    <Dashboard />
  );
}
