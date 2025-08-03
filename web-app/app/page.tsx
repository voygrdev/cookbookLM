import Dashboard from "@/components/dashboard";
import LandingPage from "@/components/landing-page";
import { createClient } from "@/middlewares/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user == null) {
    return <LandingPage />;
  }

  return <Dashboard />;
}
