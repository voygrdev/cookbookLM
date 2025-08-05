import { LoginCard } from "@/components/login-card";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-slate-400 mt-2">
            Sign in to your CookbookLM account
          </p>
        </div>
        <LoginCard />
      </div>
    </div>
  );
}
