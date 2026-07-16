import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { Features } from "lightningcss";

export default defineConfig({
  plugins: [react()],
  base: '/',
  css: {
    lightningcss: {
      // Vite v8 uses lightningcss as CSS minifier which by default converts
      // @media (min-width:X) to range syntax (width>=X).
      // Excluding MediaRangeSyntax forces it to keep the standard min-width/max-width
      // syntax that works in all browsers including Firefox < 113.
      exclude: Features.MediaRangeSyntax,
    },
  },
});
