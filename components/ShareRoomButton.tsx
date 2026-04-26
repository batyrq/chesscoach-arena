"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareRoomButton({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    const url = `${window.location.origin}/game/${roomId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button variant="secondary" onClick={copyInvite}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied invite" : "Share invite"}
    </Button>
  );
}
