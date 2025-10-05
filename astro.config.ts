import fs from "node:fs";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";
import robotsTxt from "astro-robots-txt";
import webmanifest from "astro-webmanifest";
import { defineConfig, envField } from "astro/config";
import { expressiveCodeOptions, siteConfig } from "./src/site.config";

// Hybrid 输出用主入口即可（会同时产出静态文件与函数）
import vercel from "@astrojs/vercel";

// Remark plugins
import remarkDirective from "remark-directive";
import { remarkAdmonitions } from "./src/plugins/remark-admonitions";
import { remarkReadingTime } from "./src/plugins/remark-reading-time";
import remarkMath from "remark-math";
import remarkGemoji from "remark-gemoji";

// Rehype plugins
import rehypeExternalLinks from "rehype-external-links";
import rehypeUnwrapImages from "rehype-unwrap-images";
import rehypeKatex from "rehype-katex";

import decapCmsOauth from "astro-decap-cms-oauth";

export default defineConfig({
  // ✅ 改为 Hybrid：绝大多数页面会被预渲染，仍可保留 server 路由
  output: "hybrid",
  // ✅ 默认将页面预渲染（对 sitemap 至关重要）
  prerender: { default: true },

  adapter: vercel(),

  image: { domains: ["webmention.io"] },

  integrations: [
    expressiveCode(expressiveCodeOptions),
    icon({ iconDir: "public/icons" }),
    tailwind({ applyBaseStyles: false, nesting: true }),
    sitemap(),   // 现在会在构建时真正写出 sitemap*.xml
    mdx(),
    robotsTxt(),
    webmanifest({
      name: siteConfig.title,
      short_name: "ZeroTwo",
      description: siteConfig.description,
      lang: siteConfig.lang,
      icon: "public/icon.svg",
      icons: [
        { src: "icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
        { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      start_url: "/",
      background_color: "#1d1f21",
      theme_color: "#2bbc8a",
      display: "standalone",
      config: {
        insertFaviconLinks: false,
        insertThemeColorMeta: false,
        insertManifestLink: false,
      },
    }),
    decapCmsOauth(),
  ],

  markdown: {
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          // 修正：rel 需要是字符串数组，而不是带逗号的单个字符串
          rel: ["nofollow", "noreferrer"],
          target: "_blank",
        },
      ],
      rehypeUnwrapImages,
      rehypeKatex,
    ],
    remarkPlugins: [
      remarkReadingTime,
      remarkDirective,
      remarkAdmonitions,
      remarkMath,
      remarkGemoji,
    ],
    remarkRehype: {
      footnoteLabelProperties: { className: [""] },
      footnoteLabel: "脚注：",
    },
  },

  prefetch: { defaultStrategy: "viewport", prefetchAll: true },

  // 必须是完整 https URL；它决定 sitemap 的生成与链接
  site: "https://zerotwo.in/",

  vite: {
    optimizeDeps: { exclude: ["@resvg/resvg-js"] },
    plugins: [rawFonts([".ttf", ".woff"])],
  },

  env: {
    schema: {
      WEBMENTION_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      WEBMENTION_URL: envField.string({ context: "client", access: "public", optional: true }),
      WEBMENTION_PINGBACK: envField.string({ context: "client", access: "public", optional: true }),
    },
  },
});

function rawFonts(ext: string[]) {
  return {
    name: "vite-plugin-raw-fonts",
    // @ts-expect-error:next-line
    transform(_, id) {
      if (ext.some((e) => id.endsWith(e))) {
        const buffer = fs.readFileSync(id);
        return { code: `export default ${JSON.stringify(buffer)}`, map: null };
      }
    },
  };
}
