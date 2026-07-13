import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePdrAuth } from "@/contexts/PdrAuthContext";

export function PdrGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { user, loading } = usePdrAuth();

  useEffect(() => {
    if (!loading && !user) navigate("/espace-pdr/connexion");
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
