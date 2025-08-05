import { SignUpCard } from "@/components/signup-card";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Create account
          </h1>
          <p className="text-slate-400 mt-2">
            Get started with CookbookLM today
          </p>
        </div>
        <SignUpCard />
      </div>
    </div>
  );
}
