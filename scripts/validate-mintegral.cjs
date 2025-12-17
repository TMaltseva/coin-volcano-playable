const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const mintegralDir = path.join(distDir, "mintegral");
const htmlPath = path.join(mintegralDir, "ConceptName.html");

console.log("=== Mintegral Validation ===\n");

const zipFiles = fs
  .readdirSync(distDir)
  .filter((f) => f.includes("MINTEGRAL") && f.endsWith(".zip"));

let zipPath = null;
if (zipFiles.length > 0) {
  zipPath = path.join(distDir, zipFiles[0]);
} else {
  const altZipPath = path.join(
    mintegralDir,
    "AppName_ConceptName_v1_20251216_en_MINTEGRAL.zip"
  );
  if (fs.existsSync(altZipPath)) {
    zipPath = altZipPath;
  }
}

let allChecksPassed = true;

if (zipPath && fs.existsSync(zipPath)) {
  const stats = fs.statSync(zipPath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
  const sizeKB = (stats.size / 1024).toFixed(2);
  const maxSizeMB = 5;
  const isValid = parseFloat(sizeMB) < maxSizeMB;

  console.log(`📦 ZIP Archive: ${sizeMB} MB (${sizeKB} KB)`);
  if (isValid) {
    console.log(`   ✅ Size OK (< ${maxSizeMB} MB)`);
  } else {
    console.log(`   ❌ Size exceeds ${maxSizeMB} MB limit`);
    allChecksPassed = false;
  }
} else {
  console.log("⚠️  ZIP archive not found");
  console.log(`   Looking in: ${distDir}`);
  allChecksPassed = false;
}

if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const htmlSize = Buffer.byteLength(html, "utf8");
  const htmlSizeKB = (htmlSize / 1024).toFixed(2);

  console.log(`\n📄 HTML File (loader): ${htmlSizeKB} KB`);

  const externalLinks = html.match(/src=["']https?:\/\/|href=["']https?:\/\//g);
  const hasExternal = externalLinks && externalLinks.length > 0;
  console.log(
    `🔗 External links in HTML: ${
      !hasExternal
        ? "✅ All inline"
        : `❌ Found ${externalLinks.length} external link(s)`
    }`
  );
  if (hasExternal) {
    externalLinks.slice(0, 3).forEach((link) => {
      console.log(`   - ${link.substring(0, 50)}...`);
    });
    allChecksPassed = false;
  }

  const hasBuildJS = html.includes("build.js");
  console.log(`📦 References build.js: ${hasBuildJS ? "✅" : "❌ NOT FOUND"}`);
  if (!hasBuildJS) allChecksPassed = false;
}

const buildJsPath = path.join(mintegralDir, "build.js");
if (fs.existsSync(buildJsPath)) {
  const buildJs = fs.readFileSync(buildJsPath, "utf8");
  const buildJsSize = Buffer.byteLength(buildJs, "utf8");
  const buildJsSizeMB = (buildJsSize / 1024 / 1024).toFixed(2);
  const buildJsSizeKB = (buildJsSize / 1024).toFixed(2);

  console.log(
    `\n📦 Build.js (main logic): ${buildJsSizeMB} MB (${buildJsSizeKB} KB)`
  );

  const hasSDK =
    buildJs.includes("playable-sdk") ||
    buildJs.includes("@smoud/playable-sdk") ||
    /sdk\.install|sdk\.start|sdk\.finish|sdk\.init|sdk\.on/.test(buildJs) ||
    buildJs.includes("game.install") ||
    buildJs.includes("triggerCTA");
  console.log(`🎮 Playable SDK: ${hasSDK ? "✅ Detected" : "❌ NOT FOUND"}`);
  if (!hasSDK) allChecksPassed = false;

  const hasMRAID = /mraid|MRAID|dapi|DAPI/.test(buildJs);
  console.log(
    `📱 MRAID/DAPI: ${
      hasMRAID
        ? "✅ Detected"
        : "⚠️  Not detected (may be OK for some networks)"
    }`
  );

  const hasInstall =
    /sdk\.install|game\.install|triggerCTA|mraid\.open|dapi\.openStoreUrl/.test(
      buildJs
    ) ||
    buildJs.includes("install()") ||
    buildJs.includes("mintGameStart");
  console.log(`🎯 Install event: ${hasInstall ? "✅ Found" : "❌ NOT FOUND"}`);
  if (!hasInstall) allChecksPassed = false;

  const hasGSAP = /gsap|GSAP/.test(buildJs);
  const hasPixi = /pixi|PIXI/.test(buildJs);
  console.log(`🎨 GSAP: ${hasGSAP ? "✅" : "⚠️"}`);
  console.log(`🎨 PixiJS: ${hasPixi ? "✅" : "⚠️"}`);

  const hasSDKInit =
    /sdk\.init|sdk\["init"\]|sdk\['init'\]|sdk\.on|["']init["']/.test(buildJs);
  const hasSDKStart =
    /sdk\.start|sdk\["start"\]|sdk\['start'\]|["']start["']/.test(buildJs);
  const hasSDKFinish =
    /sdk\.finish|sdk\["finish"\]|sdk\['finish'\]|["']finish["']/.test(buildJs);
  console.log(`\n📋 SDK Events:`);
  console.log(
    `   init: ${hasSDKInit ? "✅" : "⚠️  (may be minified differently)"}`
  );
  console.log(
    `   start: ${hasSDKStart ? "✅" : "⚠️  (may be minified differently)"}`
  );
  console.log(`   finish: ${hasSDKFinish ? "✅" : "❌"}`);

  if (!hasSDKFinish) {
    allChecksPassed = false;
  }

  const externalLinksInAttrs = buildJs.match(
    /(src|href)=["']https?:\/\/[^"']+/g
  );
  if (externalLinksInAttrs && externalLinksInAttrs.length > 0) {
    console.log(
      `🔗 External links in build.js: ❌ Found ${externalLinksInAttrs.length} external link(s) in attributes`
    );
    externalLinksInAttrs.slice(0, 3).forEach((link) => {
      console.log(`   - ${link.substring(0, 60)}...`);
    });
    allChecksPassed = false;
  } else {
    const urlStrings = buildJs.match(/https?:\/\/[^\s"']+/g);
    if (urlStrings && urlStrings.length > 0) {
      const storeUrls = urlStrings.filter(
        (url) =>
          url.includes("play.google.com") ||
          url.includes("apps.apple.com") ||
          url.includes("app-store")
      );
      if (storeUrls.length > 0) {
        console.log(
          `🔗 Store URLs in code: ✅ Found ${storeUrls.length} (OK for redirects)`
        );
      }
    }
  }

  console.log(`\n⚡ Performance:`);
  const hasRequestAnimationFrame = /requestAnimationFrame|rAF/.test(buildJs);
  const hasSetTimeout = /setTimeout|setInterval/.test(buildJs);
  const hasMemoryCheck = /memory|performance|Performance/.test(buildJs);
  console.log(`   Animation frames: ${hasRequestAnimationFrame ? "✅" : "⚠️"}`);
  console.log(`   Timers: ${hasSetTimeout ? "✅" : "⚠️"}`);
  console.log(
    `   Performance monitoring: ${hasMemoryCheck ? "✅" : "⚠️  (recommended)"}`
  );
} else {
  console.log(`\n❌ build.js file not found: ${buildJsPath}`);
  allChecksPassed = false;
}

console.log(`\nFile Structure:`);
if (fs.existsSync(mintegralDir)) {
  const files = fs.readdirSync(mintegralDir);
  console.log(`   Files in mintegral/: ${files.length}`);
  files.forEach((file) => {
    const filePath = path.join(mintegralDir, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`   - ${file} (${sizeKB} KB)`);
  });
} else {
  console.log(`   ❌ mintegral/ directory not found`);
  allChecksPassed = false;
}

console.log(`\n${"=".repeat(50)}`);
if (allChecksPassed) {
  console.log("✅ All checks passed! Ready for Mintegral.");
  process.exit(0);
} else {
  console.log("❌ Some checks failed. Please review the issues above.");
  process.exit(1);
}
