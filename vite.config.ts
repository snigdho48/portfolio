import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

/** Inline a tiny critical shell and load the built stylesheet asynchronously. */
function criticalCssPlugin(): Plugin {
  const critical = `
html{background:#0a0c0f;color:#f3f6f8}
html[data-theme=light]{background:#f4f7f8;color:#0c1116}
body{margin:0;min-height:100vh;font-family:"IBM Plex Sans","Segoe UI",system-ui,sans-serif;line-height:1.625;-webkit-font-smoothing:antialiased}
#root{min-height:100vh}
.font-display,h1,h2,h3,.h1,.h2,.h3,.brand-mark{font-family:Syne,"Segoe UI",system-ui,sans-serif}
`.replace(/\s+/g, " ").trim();

  return {
    name: "critical-async-css",
    enforce: "post",
    transformIndexHtml(html) {
      let next = html.replace(
        /<link([^>]*\s)rel="stylesheet"([^>]*?)href="([^"]+\.css)"([^>]*)>/g,
        (_m, pre, mid, href, post) =>
          `<link${pre}rel="preload"${mid}href="${href}"${post} as="style" onload="this.onload=null;this.rel='stylesheet'">` +
          `<noscript><link rel="stylesheet" href="${href}"></noscript>`,
      );

      if (!next.includes("/* critical-shell */")) {
        next = next.replace(
          "</head>",
          `<style>/* critical-shell */${critical}</style>\n</head>`,
        );
      }
      return next;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), criticalCssPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    cssCodeSplit: true,
    modulePreload: {
      resolveDependencies(_filename, deps) {
        // Mobile StaticLanding must not preload journey/three/gsap/lenis
        return deps.filter(
          (d) =>
            !/(^|\/)(three|journey|gsap|lenis|cmdk)[-.]/i.test(d) &&
            !/Journey(Canvas|Scene|Landing|Scroll)/i.test(d),
        );
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("three") || id.includes("@react-three") || id.includes("postprocessing")) {
              return "three";
            }
            if (id.includes("gsap") || id.includes("@gsap")) {
              return "gsap";
            }
            if (id.includes("lenis")) {
              return "lenis";
            }
            if (id.includes("cmdk")) {
              return "cmdk";
            }
            if (
              id.includes("react-dom") ||
              id.includes("react-router") ||
              id.includes("/react/")
            ) {
              return "vendor";
            }
          }
          // Do not force /src/journey into a named chunk — that created a
          // static entry→journey import and pulled three.js onto mobile.
        },
      },
    },
  },
});
