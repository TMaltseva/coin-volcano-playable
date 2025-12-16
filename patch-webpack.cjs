const fs = require("fs");
const path = require("path");

const webpackCommonPath = path.join(
  __dirname,
  "node_modules/@smoud/playable-scripts/core/webpack.common.js"
);
const webpackCommon = fs.readFileSync(webpackCommonPath, "utf8");

const aliasPattern =
  /alias:\s*\{[^}]*assets:\s*path\.resolve\('assets'\)[^}]*\}/s;
const newAliases = `alias: {
      assets: path.resolve('assets'),
      '/fonts': path.resolve('assets/fonts'),
      '/sounds': path.resolve('assets/sounds'),
      '/spritesheets': path.resolve('assets/spritesheets'),
      '/backgrounds': path.resolve('assets/backgrounds'),
      '/ui': path.resolve('assets/ui')
    }`;

if (aliasPattern.test(webpackCommon)) {
  const patched = webpackCommon.replace(aliasPattern, newAliases);
  fs.writeFileSync(webpackCommonPath, patched, "utf8");
  console.log("Webpack aliases patched successfully!");
} else {
  console.log("Could not find alias pattern to patch");
  console.log(
    "Current alias section:",
    webpackCommon.match(/alias:\s*\{[^}]*\}/s)?.[0]
  );
}
