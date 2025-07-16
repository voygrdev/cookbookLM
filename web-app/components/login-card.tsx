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
import { loginSchema } from "@/schema/loginSchema";
import { loginUser } from "@/app/login/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, LogIn } from "lucide-react";

export function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      loginSchema.parse({ email, password });

      const response = await loginUser({ email, password });

      if (response.error) {
        setError(response.message);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm border-neutral-700/60 bg-neutral-900/50 text-neutral-200 backdrop-blur-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight text-neutral-50">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400"
              >
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid gap-2">
            <Label htmlFor="email" className="text-neutral-400">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="border-neutral-700 bg-neutral-800/60 text-neutral-50 placeholder:text-neutral-500 focus-visible:ring-blue-500"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="border-neutral-700 bg-neutral-800/60 text-neutral-50 focus-visible:ring-blue-500"
            />
          </div>

          <Button
            type="submit"
            className="mt-4 flex w-full items-center gap-2 bg-blue-600 font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? (
              "Logging in..."
            ) : (
              <>
                <LogIn size={16} /> Login
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-center text-sm text-neutral-400">
          {"Don't have an account? "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            disabled={isLoading}
            className="font-semibold text-blue-500 transition-colors hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Sign Up
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}