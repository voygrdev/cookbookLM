import { LoginCard } from "@/components/login-card";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to your CookbookLM account
          </p>
        </div>
        <LoginCard />
      </div>
    </div>
  );
}
