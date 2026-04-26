import { useEffect } from "react";
import { useLocation } from "wouter";
import { useManagerAuth } from "@/contexts/ManagerAuthContext";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { user, loading } = useManagerAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/espace-manager/connexion");
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
