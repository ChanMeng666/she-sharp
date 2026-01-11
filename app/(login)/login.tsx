"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordInput } from "@/components/ui/password-strength";
import { OAuthButtons } from "@/components/ui/oauth-buttons";
import { Loader2 } from "lucide-react";
import { signIn, signUp } from "./actions";
import { ActionState } from "@/lib/auth/middleware";

export function Login({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const priceId = searchParams.get("priceId");
  const inviteId = searchParams.get("inviteId");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === "signin" ? signIn : signUp,
    { error: "" }
  );

  // Handle successful action with redirect
  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative"
      style={{
        backgroundImage: 'url(/img/bauhaus-1755865025052.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="flex items-center space-x-2 transition-all duration-200 group hover:opacity-80"
          >
            <div className="relative w-32 h-10">
              <Image
                src="/logos/she-sharp-logo.svg"
                alt="She Sharp"
                fill
                sizes="128px"
                className="object-contain transition-all duration-200 group-hover:brightness-0 group-hover:saturate-100 group-active:scale-95"
                style={{
                  filter: 'brightness(1) saturate(1)',
                }}
                priority
              />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                style={{
                  background: '#9B2E83',
                  maskImage: 'url(/logos/she-sharp-logo.svg)',
                  maskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  maskPosition: 'center',
                  WebkitMaskImage: 'url(/logos/she-sharp-logo.svg)',
                  WebkitMaskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                }}
              />
            </div>
          </Link>
        </div>

        {/* Tab Navigation */}
        <Tabs
          defaultValue={mode === "signin" ? "signin" : "signup"}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2 h-14 rounded-[50px] p-1.5">
            <TabsTrigger value="signin" asChild className="h-full rounded-[40px]">
              <Link href="/sign-in">Log in</Link>
            </TabsTrigger>
            <TabsTrigger value="signup" asChild className="h-full rounded-[40px]">
              <Link href="/sign-up">Create account</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Form Card */}
        <Card className="border-0 shadow-2xl shadow-foreground/10 bg-background/95 backdrop-blur-xl rounded-[50px]">
          <CardContent className="p-8">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-foreground mb-2">
                {mode === "signin"
                  ? "Welcome back"
                  : "Create your account and start empowering your tech career"}
              </h2>
            </div>

            <form className="space-y-4" action={formAction}>
              <input type="hidden" name="redirect" value={redirect || ""} />
              <input type="hidden" name="priceId" value={priceId || ""} />
              <input type="hidden" name="inviteId" value={inviteId || ""} />

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  defaultValue={state.email}
                  required
                  maxLength={50}
                  placeholder="you@example.com"
                  className="placeholder:text-muted-foreground/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </Label>
                  {mode === "signin" && (
                    <Link
                      href="/forgot-password"
                      className="text-sm text-foreground hover:underline"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  defaultValue={state.password}
                  required
                  minLength={8}
                  maxLength={100}
                  placeholder="Enter your password"
                  showStrength={mode === "signup"}
                  showToggle={true}
                />
              </div>

              {mode === "signup" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="invitationCode"
                    className="text-sm font-medium text-foreground"
                  >
                    Invitation Code
                  </Label>
                  <Input
                    id="invitationCode"
                    name="invitationCode"
                    type="text"
                    defaultValue={state.invitationCode || searchParams.get("code") || ""}
                    required
                    maxLength={20}
                    className="uppercase placeholder:text-muted-foreground/50"
                    placeholder="SHP-XXXX-XXXX-XXXX"
                  />
                  <p className="text-xs text-gray-500">
                    Don&apos;t have an invitation code?{" "}
                    <Link href="/mentorship/join" className="text-foreground hover:underline">
                      Apply for membership
                    </Link>
                  </p>
                </div>
              )}

              {mode === "signin" && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    value="on"
                    className="h-4 w-4 rounded border-border text-foreground focus:ring-border"
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm text-foreground"
                  >
                    Remember me for 30 days
                  </Label>
                </div>
              )}

              {state?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-red-700 text-sm">{state.error}</div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : mode === "signin" ? (
                  "Sign in to your account"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background/95 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <OAuthButtons mode={mode} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
