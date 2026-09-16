import React, { useEffect, useState } from "react";
import { Card } from "../components/ui";
import { API_BASE } from "../lib/api";

// Public, unauthenticated page a user lands on from their verification DM
// (?token=...). Fingerprints their browser/session and posts it to /api/verify.
// Replaces the bot's old standalone verify.html.
export default function VerifyPublic() {
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token. Use the link from your DM.");
      return;
    }

    const fingerprint = [
      navigator.userAgent, navigator.language, screen.width, screen.height,
      new Date().getTimezoneOffset(),
    ].join("|");

    async function hash(str) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    (async () => {
      try {
        const fp_hash = await hash(fingerprint);
        const res = await fetch(`${API_BASE}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, fingerprint: fp_hash, metadata: {} }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Verification failed");
        setStatus("done");
        setMessage("You're verified — you can close this tab and return to Discord.");
      } catch (e) {
        setStatus("error");
        setMessage(e.message);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#08090c]">
      <Card className="max-w-md w-full text-center">
        <h1 className="text-lg font-semibold text-white mb-2">Security Check</h1>
        <p className="text-[13px] text-white/60">
          {status === "checking" ? "Verifying…" : message}
        </p>
      </Card>
    </div>
  );
}
