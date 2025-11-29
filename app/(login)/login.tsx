"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PasswordInput } from "@/components/ui/password-strength";
import { OAuthButtons } from "@/components/ui/oauth-buttons";
import { Loader2 } from "lucide-react";
import { signIn, signUp } from "./actions";
import { ActionState } from "@/lib/auth/middleware";

export function Login({ mode = "signin" }: { mode?: "signin" | "signup" }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const priceId = searchParams.get("priceId");
  const inviteId = searchParams.get("inviteId");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    mode === "signin" ? signIn : signUp,
    { error: "" }
  );

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="mb-8">
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
            <TabsList className="grid w-full grid-cols-2 h-14">
              <TabsTrigger value="signin" asChild className="h-12">
                <Link href="/sign-in">Log in</Link>
              </TabsTrigger>
              <TabsTrigger value="signup" asChild className="h-12">
                <Link href="/sign-up">Create account</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Form Card */}
          <Card className="border border-gray-300 shadow-lg">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-navy-dark mb-2">
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
                    className="text-sm font-medium text-navy-dark"
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
                    className="h-10 px-3 rounded-md border border-gray-300 focus:border-purple-dark focus:ring-2 focus:ring-purple-dark/20"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-navy-dark"
                    >
                      Password
                    </Label>
                    {mode === "signin" && (
                      <Link
                        href="/forgot-password"
                        className="text-sm text-purple-dark hover:underline"
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
                    className="h-10 px-3 rounded-md border border-gray-300 focus:border-purple-dark focus:ring-2 focus:ring-purple-dark/20"
                    placeholder="Enter your password"
                    showStrength={mode === "signup"}
                    showToggle={true}
                  />
                </div>

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="invitationCode"
                      className="text-sm font-medium text-navy-dark"
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
                      className="h-10 px-3 rounded-md border border-gray-300 focus:border-purple-dark focus:ring-2 focus:ring-purple-dark/20 uppercase"
                      placeholder="SHP-XXXX-XXXX-XXXX"
                    />
                    <p className="text-xs text-gray-500">
                      Don&apos;t have an invitation code?{" "}
                      <Link href="/mentorship/join" className="text-purple-dark hover:underline">
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
                      className="h-4 w-4 rounded border-gray-300 text-purple-dark focus:ring-purple-dark"
                    />
                    <Label
                      htmlFor="rememberMe"
                      className="text-sm text-navy-dark"
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
                  className="w-full h-10 bg-purple-dark hover:bg-purple-dark/90 text-white rounded-md font-medium"
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
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
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

      {/* Right side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/img/theme-bg.png)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      </div>
    </div>
  );
}
