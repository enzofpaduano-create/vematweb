// Chargés par esbuild avec le loader "base64" (voir build.mjs) : on obtient une chaîne base64.
declare module "*.xlsx" {
  const base64: string;
  export default base64;
}
declare module "*.png" {
  const base64: string;
  export default base64;
}
