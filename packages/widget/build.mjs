// Bundles the widget into one self-contained, minified script: dist/widget.js
import { build, context } from "esbuild";

const options = {
  entryPoints: ["src/index.tsx"],
  outfile: "dist/widget.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["es2020"],
  jsx: "automatic",
  jsxImportSource: "preact",
  legalComments: "none",
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  const result = await build({ ...options, metafile: true });
  const bytes = Object.values(result.metafile.outputs)[0].bytes;
  console.log(`widget.js: ${(bytes / 1024).toFixed(1)} KB minified`);
}
