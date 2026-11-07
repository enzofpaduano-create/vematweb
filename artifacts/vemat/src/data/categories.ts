import gruesImg from "@/assets/images/grues.webp";
import nacellesImg from "@/assets/images/nacelles.webp";
import telescopiquesImg from "@/assets/images/telescopiques.webp";
import constructionImg from "@/assets/images/construction.webp";

export const categories = [
  {
    slug: "grues",
    tKey: "grues",
    href: "/grues",
    image: gruesImg,
  },
  {
    slug: "nacelles",
    tKey: "nacelles",
    href: "/nacelles",
    image: nacellesImg,
  },
  {
    slug: "elevateurs-telescopiques",
    tKey: "elevateurs",
    href: "/elevateurs-telescopiques",
    image: telescopiquesImg,
  },
  {
    slug: "construction",
    tKey: "construction",
    href: "/construction",
    image: constructionImg,
  },
] as const;
