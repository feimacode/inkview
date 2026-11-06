/// <reference types="vite/client" />
declare const __INKVIEW_VERSION__: string;
declare module "*.html" {
  const text: string;
  export default text;
}
