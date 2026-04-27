"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { Crown, LogOut, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthView, linkAuthenticatedProfile, onAuthChange, signOut, type AuthView } from "@/lib/auth";
import { loadProStatus, type ProStatus } from "@/lib/pro";

const initialAuthView: AuthView = { configured: false, session: null, user: null };
const initialProStatus: ProStatus = { isPro: false, status: "free", plan: "free", provider: "local" };

export function AuthStatus() {
  const [auth, setAuth] = useState<AuthView>(initialAuthView);
  const [pro, setPro] = useState<ProStatus>(initialProStatus);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getAuthView().then((view) => {
      if (cancelled) return;
      startTransition(() => {
        setAuth(view);
        setPro(loadProStatus());
      });
      if (view.session) void linkAuthenticatedProfile({ session: view.session });
    });

    const unsubscribe = onAuthChange((view) => {
      startTransition(() => {
        setAuth(view);
        setPro(loadProStatus());
      });
    });

    const refreshPro = () => startTransition(() => setPro(loadProStatus()));
    window.addEventListener("chesscoach:pro-updated", refreshPro);
    window.addEventListener("storage", refreshPro);

    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener("chesscoach:pro-updated", refreshPro);
      window.removeEventListener("storage", refreshPro);
    };
  }, []);

  async function logout() {
    setBusy(true);
    await signOut();
    startTransition(() => setAuth((current) => ({ ...current, session: null, user: null })));
    setBusy(false);
  }

  if (!auth.configured) {
    return (
      <Button asChild href="/auth" variant="secondary" size="sm">
        Guest mode
      </Button>
    );
  }

  if (!auth.user) {
    return (
      <Button asChild href="/auth" variant="secondary" size="sm">
        Sign in
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pro.isPro ? (
        <span className="hidden items-center gap-1 rounded-full border border-[var(--gold)]/30 bg-[rgba(248,200,106,0.1)] px-3 py-1 text-xs font-semibold text-[var(--gold)] lg:inline-flex">
          <Crown className="h-3.5 w-3.5" /> Founder Pro
        </span>
      ) : null}
      <Link href="/lobby" className="hidden max-w-[13rem] items-center gap-2 truncate rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-slate-200 lg:inline-flex">
        <UserRound className="h-3.5 w-3.5 text-[var(--mint)]" />
        <span className="truncate">{auth.user.email}</span>
      </Link>
      <Button variant="ghost" size="sm" onClick={() => void logout()} disabled={busy} title="Log out">
        <LogOut className="h-4 w-4" /> <span className="hidden lg:inline">{busy ? "..." : "Logout"}</span>
      </Button>
    </div>
  );
}
