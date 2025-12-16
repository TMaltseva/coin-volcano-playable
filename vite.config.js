import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import { resolve } from "path";

export default defineConfig({
  publicDir: "assets",
  base: "/",

  resolve: {
    alias: {
      "/fonts": resolve(__dirname, "assets/fonts"),
      "/sounds": resolve(__dirname, "assets/sounds"),
      "/spritesheets": resolve(__dirname, "assets/spritesheets"),
      "/backgrounds": resolve(__dirname, "assets/backgrounds"),
      "/ui": resolve(__dirname, "assets/ui"),
    },
  },

  plugins: [
    createHtmlPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
      },
    }),
  ],

  build: {
    outDir: "dist",
    assetsDir: "assets",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 3,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      input: "./index.html",
      output: {
        assetFileNames: (assetInfo) => {
          if (
            assetInfo.name.endsWith(".woff2") ||
            assetInfo.name.endsWith(".ttf")
          ) {
            return "assets/fonts/[name][extname]";
          }
          return "assets/[name].[hash][extname]";
        },
        chunkFileNames: "assets/[name].[hash].js",
        entryFileNames: "assets/[name].[hash].js",
      },
    },
    sourcemap: false,
  },

  server: {
    port: 3000,
    open: true,
  },
});
