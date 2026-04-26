import { useEffect } from "react";
import { useLocation } from "wouter";
import { LogOut, ExternalLink } from "lucide-react";
import { useGoogleAuth } from "@/contexts/GoogleAuthContext";
import vematLogo from "@/assets/vemat-logo.png";

const WORKSPACE_APPS = [
  {
    name: "Gmail",
    url: "https://mail.google.com",
    color: "#EA4335",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.910 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
        <path d="M0 5.457v13.909c0 .904.732 1.636 1.636 1.636h3.819V11.73L12 16.64V9.548L5.455 4.64 3.927 3.493C2.309 2.28 0 3.434 0 5.457z" fill="#C5221F"/>
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64V9.548l6.545-4.910 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#C5221F"/>
      </svg>
    ),
  },
  {
    name: "Drive",
    url: "https://drive.google.com",
    color: "#1FA463",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path d="M6.28 3h11.44l-2.1 3.636H4.18L6.28 3z" fill="#0066DA"/>
        <path d="M15.62 3l4.2 7.273-2.1 3.636L13.52 6.636 15.62 3z" fill="#00AC47"/>
        <path d="M4.18 6.636l4.2 7.273H2.08l2.1-3.636v-3.637z" fill="#EA4335"/>
        <path d="M2.08 13.91h19.84l-2.1 3.636H4.18L2.08 13.91z" fill="#00832D"/>
        <path d="M19.82 10.273l2.1 3.636-2.1 3.637-4.2-7.273h4.2z" fill="#2684FC"/>
        <path d="M4.18 13.91L8.38 6.636h7.14l-4.2 7.273H4.18z" fill="#FFBA00"/>
      </svg>
    ),
  },
  {
    name: "Agenda",
    url: "https://calendar.google.com",
    color: "#1A73E8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <rect x="2" y="4" width="20" height="18" rx="2" fill="white" stroke="#1A73E8" strokeWidth="1.5"/>
        <path d="M2 9h20" stroke="#1A73E8" strokeWidth="1.5"/>
        <path d="M8 2v4M16 2v4" stroke="#1A73E8" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="6" y="13" width="3" height="3" rx="0.5" fill="#EA4335"/>
        <rect x="10.5" y="13" width="3" height="3" rx="0.5" fill="#1A73E8"/>
        <rect x="15" y="13" width="3" height="3" rx="0.5" fill="#34A853"/>
      </svg>
    ),
  },
  {
    name: "Meet",
    url: "https://meet.google.com",
    color: "#00897B",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <rect x="2" y="6" width="13" height="12" rx="2" fill="#00897B"/>
        <path d="M15 10l7-4v12l-7-4V10z" fill="#00897B"/>
      </svg>
    ),
  },
  {
    name: "Docs",
    url: "https://docs.google.com",
    color: "#4285F4",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#4285F4"/>
        <path d="M14 2v6h6" fill="#1A56DB"/>
        <path d="M8 13h8M8 17h5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: "Sheets",
    url: "https://sheets.google.com",
    color: "#34A853",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#34A853"/>
        <path d="M14 2v6h6" fill="#188038"/>
        <path d="M8 12h8v1H8zM8 14h8v1H8zM8 16h8v1H8z" fill="white"/>
        <path d="M11 12v6M14 12v6" stroke="white" strokeWidth="0.5"/>
      </svg>
    ),
  },
  {
    name: "Slides",
    url: "https://slides.google.com",
    color: "#FBBC04",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" fill="#FBBC04"/>
        <path d="M14 2v6h6" fill="#E37400"/>
        <rect x="7" y="11" width="10" height="7" rx="1" fill="white"/>
      </svg>
    ),
  },
  {
    name: "Chat",
    url: "https://chat.google.com",
    color: "#1A73E8",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="#1A73E8"/>
        <path d="M7 9h10M7 13h7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    name: "Admin",
    url: "https://admin.google.com",
    color: "#5F6368",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <circle cx="12" cy="8" r="4" fill="#5F6368"/>
        <path d="M20 19c0-4.418-3.582-8-8-8s-8 3.582-8 8" stroke="#5F6368" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="18" cy="18" r="4" fill="#34A853"/>
        <path d="M16.5 18l1 1 2-2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function Workspace() {
  const { user, logout } = useGoogleAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-zinc-50 pt-20">
      {/* Header */}
      <div className="bg-white border-b border-zinc-100">
        <div className="container mx-auto px-4 md:px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={vematLogo} alt="Vemat" className="h-8 brightness-0" />
            <div className="w-px h-8 bg-zinc-200" />
            <div>
              <h1 className="text-lg font-bold text-zinc-900">Espace Vemat</h1>
              <p className="text-xs text-zinc-400">Bonjour, {user.given_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-full">
              <img
                src={user.picture}
                alt={user.name}
                className="w-7 h-7 rounded-full"
                referrerPolicy="no-referrer"
              />
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-zinc-900 leading-none">{user.name}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 border border-zinc-200 px-3 py-2 rounded-full hover:border-zinc-400 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>

      {/* App grid */}
      <div className="container mx-auto px-4 md:px-6 py-12">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-8">
          Applications Google Workspace
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {WORKSPACE_APPS.map((app) => (
            <a
              key={app.name}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg transition-all duration-300 p-6 flex flex-col items-center gap-4 rounded-xl"
            >
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-zinc-50 group-hover:scale-110 transition-transform duration-300">
                {app.icon}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-zinc-900">{app.name}</p>
              </div>
              <ExternalLink className="h-3.5 w-3.5 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
            </a>
          ))}
        </div>

        {/* Quick access back to site */}
        <div className="mt-16 pt-8 border-t border-zinc-200">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 mb-6">
            Site Vemat Group
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Grues", href: "/grues" },
              { label: "Nacelles", href: "/nacelles" },
              { label: "Pièces de rechange", href: "/pieces-de-rechange" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="bg-white border border-zinc-200 hover:border-accent hover:text-accent px-4 py-3 text-sm font-semibold text-zinc-700 rounded-lg text-center transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
