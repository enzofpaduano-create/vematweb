import { useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  // Page inexistante : on demande aux moteurs de recherche de ne pas l'indexer.
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex");
    document.head.appendChild(meta);
    const previousTitle = document.title;
    document.title = "Page introuvable | Vemat Group";
    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Page introuvable</h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            Cette page n'existe pas ou a été déplacée. / This page does not exist or has moved.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-gray-900 underline">
            Retour à l'accueil · Back to home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
