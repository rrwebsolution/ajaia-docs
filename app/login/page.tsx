"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Cloud,
  Eye,
  EyeOff,
  FileText,
  List,
  ListOrdered,
  Lock,
  Loader2,
  Mail,
  PenLine,
  Share2,
  Shield,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function FeaturePill({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

function ProductPreview() {
  return (
    <div className="relative mt-10 hidden lg:block" aria-hidden>
      <div className="absolute -top-6 -left-8 z-20 flex size-9 items-center justify-center rounded-lg bg-white/10 text-white shadow-lg ring-1 ring-white/15 backdrop-blur-sm">
        <Cloud className="size-4" />
      </div>
      <div className="absolute top-8 -right-6 z-20 flex size-9 items-center justify-center rounded-lg bg-white/10 text-white shadow-lg ring-1 ring-white/15 backdrop-blur-sm">
        <FileText className="size-4" />
      </div>

      <div className="absolute -bottom-5 -left-6 z-20 flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-slate-700 shadow-xl">
        <span className="flex size-6 items-center justify-center rounded bg-indigo-50 text-indigo-600">
          <FileText className="size-3.5" />
        </span>
        <span className="text-xs leading-tight">
          <span className="block font-medium">meeting-notes.md</span>
          <span className="block text-[10px] text-slate-400">48 KB</span>
        </span>
      </div>

      <div className="relative z-10 ml-2 rounded-xl border border-white/10 bg-white text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between rounded-t-xl border-b border-slate-100 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded bg-indigo-600 text-white">
              <FileText className="size-3" />
            </span>
            <span className="text-xs font-medium text-slate-500">Ajaia Docs</span>
          </div>
          <span className="flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-medium text-white">
            <Share2 className="size-3" />
            Share
          </span>
        </div>

        <div className="flex">
          <div className="hidden w-24 flex-col gap-1 border-r border-slate-100 px-2 py-3 xl:flex">
            <span className="rounded-md bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700">
              My Documents
            </span>
            <span className="rounded-md px-2 py-1 text-[10px] text-slate-500">
              Shared with Me
            </span>
          </div>

          <div className="flex-1 px-4 py-3">
            <div className="mb-2.5 flex items-center gap-2 text-slate-400">
              <span className="text-[11px] font-bold">B</span>
              <span className="text-[11px] italic">I</span>
              <span className="text-[11px] underline">U</span>
              <span className="h-3 w-px bg-slate-200" />
              <List className="size-3" />
              <ListOrdered className="size-3" />
            </div>
            <p className="text-sm font-semibold text-slate-900">Project Planning</p>
            <div className="mt-2.5 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-100" />
              <div className="h-1.5 w-11/12 rounded-full bg-slate-100" />
              <div className="h-1.5 w-4/5 rounded-full bg-slate-100" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex -space-x-1.5">
                <span className="flex size-5 items-center justify-center rounded-full border-2 border-white bg-amber-400 text-[8px] font-semibold text-white">
                  RR
                </span>
                <span className="flex size-5 items-center justify-center rounded-full border-2 border-white bg-emerald-400 text-[8px] font-semibold text-white">
                  AC
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                <Check className="size-3" />
                Saved
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandingPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-blue-800 to-indigo-700 px-8 py-8 text-white md:flex md:w-[42%] md:flex-col lg:w-[48%] lg:px-14 lg:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-20 size-80 rounded-full bg-blue-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-indigo-400/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
            <FileText className="size-4.5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Ajaia Docs</span>
        </div>
        <div className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm lg:flex">
          <ShieldCheck className="size-3.5" />
          Secure &amp; Private
        </div>
      </div>

      <div className="relative z-10 mt-12 max-w-lg lg:mt-16 lg:max-w-md">
        <h1 className="text-3xl leading-[1.15] font-semibold tracking-tight lg:text-[2.75rem]">
          Create together.
          <br />
          Move ideas <span className="text-cyan-300">forward.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-blue-100/80 lg:text-base">
          A focused workspace for writing, organizing, and sharing documents
          with your team.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <FeaturePill icon={PenLine} label="Rich Text Editor" />
          <FeaturePill icon={Share2} label="Simple Sharing" />
          <FeaturePill icon={Cloud} label="Cloud Storage" />
        </div>

        <ProductPreview />
      </div>

      <div className="relative z-10 mt-auto hidden items-center gap-5 pt-10 text-xs text-blue-100/70 lg:flex">
        <span className="flex items-center gap-1.5">
          <Shield className="size-3.5" />
          Secure by design
        </span>
        <span className="h-3 w-px bg-white/20" />
        <span className="flex items-center gap-1.5">
          <Users className="size-3.5" />
          Built for teams
        </span>
        <span className="h-3 w-px bg-white/20" />
        <span className="flex items-center gap-1.5">
          <Zap className="size-3.5" />
          Easy to use
        </span>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;

    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Unable to sign in. Please check your email and password.");
      return;
    }

    const redirectTo = searchParams.get("redirectTo") || "/documents";
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen w-full overflow-x-hidden bg-white">
      <BrandingPanel />

      <div className="relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden bg-slate-50/60 px-5 py-10 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-blue-100/70 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 -left-16 size-64 rounded-full bg-indigo-100/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/3 -right-20 h-px w-96 rotate-12 bg-gradient-to-r from-transparent via-blue-200 to-transparent"
        />

        <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/20">
              <FileText className="size-6" />
            </span>
            <span className="mt-3 text-base font-semibold tracking-tight text-slate-900">
              Ajaia Docs
            </span>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Sign in to continue to your workspace.
            </p>
          </div>

          <Card className="rounded-2xl border-slate-200 shadow-lg shadow-slate-200/50">
            <CardContent className="p-6 sm:p-7">
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-slate-700">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-xl border-slate-200 pl-10 focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-slate-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-xl border-slate-200 pr-10 pl-10 focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      disabled={loading}
                      className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1 text-slate-400 transition-colors hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-indigo-500/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-medium text-white shadow-md shadow-indigo-600/20 transition-all",
                    "hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99]",
                    "focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:outline-none",
                    "disabled:pointer-events-none disabled:opacity-60",
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-blue-50 px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-600" />
            <p className="text-xs leading-relaxed text-blue-900/80">
              Your documents are protected with secure authenticated access.
            </p>
          </div>
        </div>

        <p className="relative z-10 mt-10 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Ajaia Docs. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
