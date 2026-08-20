import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogOut } from "lucide-react";
import { getToken } from "../lib/auth";
import { useAuth } from "../context/AuthContext";

const SITE_URL = "https://arach.lol";

const LINKS = [
  { href: SITE_URL, label: "Home" },
  { href: `${SITE_URL}/commands`, label: "Commands" },
  { href: `${SITE_URL}/docs`, label: "Docs" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { logout } = useAuth();
  const authed = !!getToken();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isScrolled ? "px-3 sm:px-4 pt-3 sm:pt-4" : "px-0 pt-0"
        }`}
      >
        <div
          className={`mx-auto flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isScrolled
              ? "max-w-7xl rounded-2xl border border-white/15 bg-[#0d0d0d] backdrop-blur-xl px-6 h-[56px]"
              : "max-w-7xl rounded-none border border-transparent bg-transparent px-6 h-[60px]"
          }`}
        >
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="flex text-blue-500 items-center group">
              <img src="/arachnid.png" className="w-10 mr-1" alt="Arachnid" />
            </Link>
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="flex text-gray-200 text-sm font-thin mr-2 items-center group hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <img src="/arachnid.png" className="md:hidden w-10 h-10 rounded-lg" alt="Arachnid" />

            {authed && (
              <button
                onClick={logout}
                className="hidden md:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-red-500/20 border border-white/[0.08] hover:border-red-500/30 text-white/70 hover:text-red-300 text-[13px] font-medium transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            )}

            <button
              onClick={() => setIsOpen(true)}
              className="absolute right-5 md:hidden p-2 -ml-2 text-white/70 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 z-[100] md:hidden bg-[#0d0d0d]/95 backdrop-blur-xl flex flex-col">
          <div className="flex items-center justify-between px-6 h-[60px] border-b border-white/[0.06]">
            <img src="/arachnid.png" className="w-10 h-10 rounded-lg" alt="Arachnid" />
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-white/50 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="pt-3 space-y-1">
              {LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.05]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {authed && (
            <div className="p-4 border-t border-white/[0.06]">
              <button
                onClick={logout}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/[0.06] hover:bg-red-500/20 border border-white/[0.08] text-white/70 hover:text-red-300 font-medium transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
