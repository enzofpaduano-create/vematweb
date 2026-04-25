import { useState, useEffect } from "react";
import type { BlogPost } from "@/data/blog";

export function useLinkedInPosts(): BlogPost[] {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetch("/linkedin-posts.json")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []))
      .catch(() => {});
  }, []);

  return posts;
}
