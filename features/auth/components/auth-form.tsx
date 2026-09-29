"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginWithCredentials, signupUser } from "@/services/auth-service";

interface AuthFormProps {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (isSignup) {
        await signupUser({ name, email, password });
      }
      await loginWithCredentials({ email, password, callbackUrl });
      toast.success(isSignup ? "Account created" : "Welcome back");
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <Card className="border-border/60 bg-card/70 backdrop-blur-xl shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            {isSignup ? "Create your account" : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {isSignup
              ? "Start learning with your AI mentor"
              : "Sign in to continue your conversation"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lakshay Diwan"
                  required
                  autoComplete="name"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link
              href={isSignup ? "/login" : "/signup"}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
