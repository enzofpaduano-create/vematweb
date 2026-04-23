import { useEffect } from "react";

export function useSEO(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} | Vemat Group`;
    
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement("meta");
      metaDescription.setAttribute("name", "description");
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute("content", description);
  }, [title, description]);
}

export function useScrollTop() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}
