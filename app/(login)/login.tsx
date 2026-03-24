"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useEffect, useState, useCallback } from "react";
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
import { Loader2, CheckCircle2 } from "lucide-react";
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

  // OAuth invitation code pre-validation state (signup mode only)
  const [oauthInviteCode, setOauthInviteCode] = useState(
    searchParams.get("code") || ""
  );
  const [isCodeValidated, setIsCodeValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeInfo, setCodeInfo] = useState("");

  // Handle successful action with redirect
  useEffect(() => {
    if (state?.success && state?.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [state, router]);

  // Validate invitation code and set cookie for OAuth flow
  const validateCodeForOAuth = useCallback(async () => {
    const code = oauthInviteCode.trim();
    if (!code) {
      setCodeError("Please enter your invitation code.");
      return;
    }

    setIsValidating(true);
    setCodeError("");
    setCodeInfo("");

    try {
      // Step 1: Validate the code
      const validateRes = await fetch("/api/invitation-codes/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const validateData = await validateRes.json();

      if (!validateData.valid) {
        setCodeError(validateData.error || "Invalid invitation code.");
        setIsCodeValidated(false);
        return;
      }

      // Step 2: Set the cookie for OAuth flow
      const cookieRes = await fetch("/api/auth/set-invite-cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const cookieData = await cookieRes.json();

      if (!cookieData.success) {
        setCodeError(cookieData.error || "Failed to prepare invitation code.");
        setIsCodeValidated(false);
        return;
      }

      setIsCodeValidated(true);
      setCodeInfo(
        cookieData.isEmailSpecific
          ? "Code verified. Please use the email associated with this code for OAuth sign-up."
          : "Code verified. You can now sign up with Google or GitHub."
      );
    } catch {
      setCodeError("Failed to validate code. Please try again.");
      setIsCodeValidated(false);
    } finally {
      setIsValidating(false);
    }
  }, [oauthInviteCode]);

  // Reset validation when code changes
  const handleCodeChange = (value: string) => {
    setOauthInviteCode(value);
    if (isCodeValidated) {
      setIsCodeValidated(false);
      setCodeInfo("");
    }
    setCodeError("");
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center py-8 px-4 sm:py-10 sm:px-6 md:py-12">
      {/* Background Image */}
      <Image
        src="/img/signup.png"
        alt=""
        fill
        className="object-cover"
        priority
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Centered Form */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-6 sm:mb-8 flex justify-center">
            <Link
              href="/"
              className="flex items-center space-x-2 transition-all duration-200 group hover:opacity-80"
            >
              <div className="relative w-28 h-9 sm:w-32 sm:h-10">
                <Image
                  src="/logos/she-sharp-logo.svg"
                  alt="She Sharp"
                  fill
                  sizes="128px"
                  className="object-contain transition-all duration-200 group-active:scale-95"
                  style={{
                    filter: 'brightness(0) invert(1)',
                  }}
                  priority
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                  style={{
                    background: '#ffffff',
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
            className="mb-4 sm:mb-6"
          >
            <TabsList className="grid w-full grid-cols-2 h-12 sm:h-14 rounded-[var(--radius-card-lg)] p-1.5 bg-white/20 backdrop-blur-md">
              <TabsTrigger value="signin" asChild className="h-full rounded-[var(--radius-card-md)] text-white/70 data-[state=active]:bg-white data-[state=active]:text-foreground">
                <Link href="/sign-in">Log in</Link>
              </TabsTrigger>
              <TabsTrigger value="signup" asChild className="h-full rounded-[var(--radius-card-md)] text-white/70 data-[state=active]:bg-white data-[state=active]:text-foreground">
                <Link href="/sign-up">Create account</Link>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Form Card */}
          <Card className="card-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-5 sm:p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-base sm:text-lg font-medium text-foreground mb-2">
                  {mode === "signin"
                    ? "Welcome back"
                    : "Create your account and start empowering your tech career"}
                </h2>
              </div>

              <form className="space-y-3 sm:space-y-4" action={formAction}>
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
                      className="uppercase"
                      placeholder="SHP-XXXX-XXXX-XXXX"
                    />
                    <p className="text-xs text-gray-500">
                      Don&apos;t have an invitation code?{" "}
                      <Link href="/mentorship/mentee" className="text-foreground hover:underline">
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
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
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
                    <span className="px-2 bg-white/95 text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* OAuth invitation code pre-validation (signup mode only) */}
                {mode === "signup" && (
                  <div className="mt-4 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={oauthInviteCode}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        placeholder="Enter invitation code for OAuth"
                        className="uppercase flex-1"
                        maxLength={20}
                        disabled={isValidating}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={validateCodeForOAuth}
                        disabled={isValidating || isCodeValidated || !oauthInviteCode.trim()}
                        className="shrink-0"
                      >
                        {isValidating ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : isCodeValidated ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                    {codeError && (
                      <p className="text-xs text-red-600">{codeError}</p>
                    )}
                    {codeInfo && (
                      <p className="text-xs text-green-600">{codeInfo}</p>
                    )}
                  </div>
                )}

                <div className={mode === "signup" ? "mt-2 space-y-2" : "mt-4 space-y-2"}>
                  <OAuthButtons
                    mode={mode}
                    disabled={mode === "signup" && !isCodeValidated}
                  />
                  {mode === "signup" && !isCodeValidated && (
                    <p className="text-xs text-center text-gray-400">
                      Verify your invitation code above to enable OAuth sign-up
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
