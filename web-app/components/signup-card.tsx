"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { signupSchema } from "@/schema/signupSchema";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { signupUser } from "@/app/signup/actions";


export function SignUpCard() {

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
            const validatedData = signupSchema.parse({ email, password });

            if (!validatedData) {
                setError("Invalid input data");
                return;
            }

            const response = await signupUser({
                email: email,
                password: password,
            });

            if (response.error) {
                setError(response.message);
            } else {
                router.push("/login");
            }

            setEmail("");
            setPassword("");
        } catch (err) {
            if (err instanceof z.ZodError) {
                setError(err.issues[0].message);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <Card className="w-full max-w-sm bg-neutral-800 text-white p-2">
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Enter your email below to create a new account
        </CardDescription>
        <Button className="bg-white hover:bg-white/80 text-black text-center" onClick={() => router.push("/login")}>Login</Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm p-2 bg-red-400/10 rounded-md">
                {error}
              </div>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-white/85 mt-4"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
