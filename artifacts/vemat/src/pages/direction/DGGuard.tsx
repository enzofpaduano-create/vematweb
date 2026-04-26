import { useEffect } from "react";
import { useLocation } from "wouter";
import { useDGAuth } from "@/contexts/DGAuthContext";

export function DGGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { user, loading } = useDGAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/direction/connexion");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
