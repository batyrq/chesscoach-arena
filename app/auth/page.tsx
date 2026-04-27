"use client";

import { startTransition, useEffect, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, LockKeyhole, Mail, MapPin, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { friendlyAuthError, getAuthView, linkAuthenticatedProfile } from "@/lib/auth";
import { cities } from "@/lib/demo-data";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { loadProfile } from "@/lib/storage";
import type { City } from "@/lib/types";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("Guest Gambiteer");
  const [city, setCity] = useState<City>("Almaty");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    const profile = loadProfile();
    void getAuthView().then((view) => {
      startTransition(() => {
        setConfigured(view.configured);
        if (profile) {
          setDisplayName(profile.name);
          setCity(profile.city);
        }
      });
      if (view.session) router.replace("/lobby");
    });
  }, [router]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getBrowserSupabaseClient();
    setError("");
    setMessage("");

    if (!supabase) {
      setConfigured(false);
      setMessage("Supabase auth is not configured here. Continue in guest mode and your progress will stay local.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim(), city } },
        });

        if (signUpError) throw signUpError;

        if (!data.session) {
          setMessage("Account created. If email confirmation is enabled in Supabase, confirm your email or disable Confirm Email for demo mode.");
          return;
        }

        await linkAuthenticatedProfile({ session: data.session, displayName, city });
        router.replace("/lobby");
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;
      if (data.session) await linkAuthenticatedProfile({ session: data.session, displayName, city });
      router.replace("/lobby");
    } catch (authError) {
      setError(friendlyAuthError(authError instanceof Error ? authError.message : undefined));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-6xl items-center gap-8 px-5 pb-16 md:px-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--mint)]">Player account</p>
          <h1 className="mt-4 font-[var(--font-display)] text-5xl font-black leading-tight tracking-[-0.05em]">
            Save your coach history and keep your city rank.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Sign up for the demo account path, sync Pro status across devices, and keep your leaderboard progress beyond a single browser.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <Proof icon={<ShieldCheck className="h-4 w-4" />} label="No email gate" value="Demo starts immediately" />
            <Proof icon={<Sparkles className="h-4 w-4" />} label="Coach sync" value="Reviews stay linked" />
            <Proof icon={<BadgeCheck className="h-4 w-4" />} label="Pro status" value="Founder badge travels" />
          </div>
        </section>
        <Card className="p-6 md:p-8">
          <div className="grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-slate-950/45 p-1">
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-[var(--gold)] text-slate-950" : "text-slate-300 hover:text-white"}`}
              onClick={() => setMode("signin")}
              type="button"
            >
              Sign in
            </button>
            <button
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-[var(--gold)] text-slate-950" : "text-slate-300 hover:text-white"}`}
              onClick={() => setMode("signup")}
              type="button"
            >
              Sign up
            </button>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={(event) => void submit(event)}>
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Mail className="h-4 w-4 text-[var(--mint)]" /> Email</span>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" required />
            </label>
            <label className="space-y-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><LockKeyhole className="h-4 w-4 text-[var(--mint)]" /> Password</span>
              <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="At least 6 characters" required minLength={6} />
            </label>

            {mode === "signup" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><UserRound className="h-4 w-4 text-[var(--gold)]" /> Display name</span>
                  <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your chess name" />
                </label>
                <label className="space-y-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><MapPin className="h-4 w-4 text-[var(--gold)]" /> City</span>
                  <Select value={city} onChange={(event) => setCity(event.target.value as City)}>
                    {cities.map((item) => <option key={item}>{item}</option>)}
                  </Select>
                </label>
              </div>
            ) : null}

            {!configured ? (
              <div className="rounded-[1.25rem] border border-[var(--gold)]/25 bg-[rgba(248,200,106,0.08)] p-4 text-sm leading-6 text-slate-300">
                Auth is not configured in this environment. Guest mode still works, including local games, reviews, Pro demo, and leaderboard fallback.
              </div>
            ) : null}
            {message ? <p className="rounded-[1.25rem] border border-[var(--mint)]/25 bg-[rgba(118,247,203,0.08)] p-4 text-sm leading-6 text-slate-200">{message}</p> : null}
            {error ? <p className="rounded-[1.25rem] border border-[var(--coral)]/30 bg-[rgba(255,127,127,0.08)] p-4 text-sm leading-6 text-slate-200">{error}</p> : null}

            <Button size="lg" disabled={loading || !configured}>
              {loading ? "Syncing..." : mode === "signup" ? "Create demo account" : "Sign in and sync"}
            </Button>
            <p className="text-xs leading-5 text-slate-500">
              For the demo, signup starts immediately without email confirmation. If the dashboard still requires confirmation, turn Confirm Email off in the Supabase Email provider settings.
            </p>
          </form>
        </Card>
      </main>
    </AppShell>
  );
}

function Proof({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500">{icon}{label}</p>
      <p className="mt-2 font-[var(--font-display)] text-lg font-bold">{value}</p>
    </div>
  );
}
