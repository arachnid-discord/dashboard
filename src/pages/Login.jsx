import React from "react";
import { buildLoginUrl, CLIENT_ID } from "../lib/auth";
import { Button, ErrorBanner } from "../components/ui";
import Navbar from "../components/Navbar";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <Navbar />
      <div className="w-full max-w-sm text-center">
        <img src="/arachnid.png" alt="Arachnid" className="w-14 h-14 mx-auto mb-6 rounded-2xl" />
        <h1 className="text-2xl font-semibold text-white mb-2">Arachnid Dashboard</h1>
        <p className="text-white/40 text-[14px] mb-8 leading-relaxed">
          Sign in with Discord to manage moderation, welcome messages, leveling, and every other
          part of the bot for your servers.
        </p>

        {!CLIENT_ID ? (
          <ErrorBanner message="VITE_DISCORD_CLIENT_ID is not set. Copy .env.example to .env and fill it in." />
        ) : (
          <Button
            variant="discord"
            className="w-full py-3"
            onClick={() => (window.location.href = buildLoginUrl())}
          >
            Login with Discord
          </Button>
        )}
      </div>
    </div>
  );
}
