export interface ProductImage {
  path: string;
}

export interface ProductDownload {
  label: string;
  url: string;
}

export interface ProductVideo {
  label: string;
  url: string;
}

export interface ProductInteractiveExteriorView {
  imagePath: string;
  frameCount: number;
  imageExtension?: "jpg" | "png" | "webp";
}

export interface ProductInteractiveIframeView {
  url: string;
}

export interface ProductInteractiveView {
  sourceUrl?: string;
  exterior?: ProductInteractiveExteriorView;
  lowerCabin?: ProductInteractiveIframeView;
  upperCabin?: ProductInteractiveIframeView;
}

export interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  description: string | { fr: string; en: string };
  images: ProductImage[];
  specifications: Record<string, string | { fr: string; en: string }>;
  downloads: ProductDownload[];
  videos?: ProductVideo[];
  features?: string[] | { fr: string[]; en: string[] };
}
