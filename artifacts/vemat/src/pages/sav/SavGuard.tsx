import { useEffect } from "react";
import { useLocation } from "wouter";
import { useSavAuth } from "@/contexts/SavAuthContext";

export function SavGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { user, loading } = useSavAuth();

  useEffect(() => {
    if (!loading && !user) navigate("/espace-sav/connexion");
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
