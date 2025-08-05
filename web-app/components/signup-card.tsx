"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupSchema } from "@/schema/signupSchema";
import { signupUser } from "@/app/signup/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { AlertTriangle, UserPlus, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export function SignUpCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        toast.error("Validation error", {
          description: "Passwords do not match",
        });
        return;
      }

      signupSchema.parse({ email, password });

      const response = await signupUser({ email, password });

      if (response.error) {
        setError(response.message);
        toast.error("Signup failed", {
          description: response.message,
        });
      } else {
        toast.success("Account created successfully!", {
          description:
            "Please check your email to verify your account, then sign in.",
        });
        router.push("/login");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errorMessage = err.issues[0].message;
        setError(errorMessage);
        toast.error("Validation error", {
          description: errorMessage,
        });
      } else {
        const errorMessage = "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        toast.error("Error", {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full bg-slate-900/80 border-slate-700/50 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-center mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-6 w-6 text-blue-400" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
              CookbookLM
            </span>
          </div>
        </div>
        <CardTitle className="text-2xl text-center text-white">
          Create account
        </CardTitle>
        <CardDescription className="text-center text-slate-300">
          Enter your details to create your new account
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center space-x-2 p-3 text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-md">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-200">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="bg-slate-800/80 border-slate-600/50 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-200">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="bg-slate-800/80 border-slate-600/50 text-white placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-200">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              className="bg-slate-800/80 border-slate-600/50 text-white placeholder:text-slate-400"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create account
              </>
            )}
          </Button>

          <div className="text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
