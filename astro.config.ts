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

// ✅ 使用与 output: 'server' 匹配的 vercel 适配器入口
import vercel from "@astrojs/vercel/serverless";

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
  // 你需要 server 环境以支持 CMS OAuth 回调，保持 server 输出
  output: "server",
  adapter: vercel(),

  image: {
    domains: ["webmention.io"],
  },

  integrations: [
    expressiveCode(expressiveCodeOptions),
    icon({ iconDir: "public/icons" }),
    tailwind({ applyBaseStyles: false, nesting: true }),
    // ✅ 站点地图已启用
    sitemap(),
    mdx(),
    robotsTxt(),
    webmanifest({
      // See: https://github.com/alextim/astro-lib/blob/main/packages/astro-webmanifest/README.md
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
          // ✅ 这里必须是数组形式的多个值
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

  // 预取策略保持不变
  prefetch: { defaultStrategy: "viewport", prefetchAll: true },

  // ⚠️ 这里必须是完整的 https URL，决定 sitemap 是否生成
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
