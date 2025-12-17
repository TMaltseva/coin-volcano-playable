const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");

console.log("=== Unity Ads Validation ===\n");

const unityFiles = fs
  .readdirSync(distDir)
  .filter((f) => f.includes("UNITY") && f.endsWith(".html"));

let htmlPath = null;
if (unityFiles.length > 0) {
  htmlPath = path.join(distDir, unityFiles[0]);
} else {
  console.log("❌ Unity HTML file not found in dist/");
  process.exit(1);
}

let allChecksPassed = true;

if (fs.existsSync(htmlPath)) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const htmlSize = Buffer.byteLength(html, "utf8");
  const htmlSizeMB = (htmlSize / 1024 / 1024).toFixed(2);
  const htmlSizeKB = (htmlSize / 1024).toFixed(2);

  console.log(`📄 File: ${path.basename(htmlPath)}`);
  console.log(`📄 Size: ${htmlSizeMB} MB (${htmlSizeKB} KB)`);

  const maxSizeMB = 5;
  const sizeValid = parseFloat(htmlSizeMB) < maxSizeMB;
  if (sizeValid) {
    console.log(`   ✅ Size OK (< ${maxSizeMB} MB)`);
  } else {
    console.log(
      `   ⚠️  Size exceeds ${maxSizeMB} MB (may still be acceptable)`
    );
  }

  const hasSDK =
    html.includes("playable-sdk") ||
    html.includes("@smoud/playable-sdk") ||
    html.includes("sdk.install") ||
    html.includes("sdk.start") ||
    html.includes("sdk.finish");
  console.log(`\n🎮 Playable SDK: ${hasSDK ? "✅ Detected" : "❌ NOT FOUND"}`);
  if (!hasSDK) allChecksPassed = false;

  const hasMRAID = html.includes("mraid") || html.includes("MRAID");
  const hasUnityProtocol = html.includes("unity") || html.includes("Unity");
  console.log(`📱 MRAID: ${hasMRAID ? "✅" : "⚠️  Not detected"}`);
  console.log(
    `📱 Unity Protocol: ${hasUnityProtocol ? "✅" : "⚠️  Not detected"}`
  );

  const hasInstall =
    html.includes("sdk.install()") ||
    html.includes("sdk.install") ||
    html.includes("game.install()") ||
    html.includes("mraid.open") ||
    html.includes("triggerCTA");
  console.log(`🎯 Install event: ${hasInstall ? "✅ Found" : "❌ NOT FOUND"}`);
  if (!hasInstall) allChecksPassed = false;

  const externalLinks = html.match(/src=["']https?:\/\/|href=["']https?:\/\//g);
  const hasExternal = externalLinks && externalLinks.length > 0;
  console.log(
    `🔗 External links: ${
      !hasExternal
        ? "✅ All inline"
        : `❌ Found ${externalLinks.length} external link(s)`
    }`
  );
  if (hasExternal) {
    console.log(`   External links found:`);
    externalLinks.slice(0, 5).forEach((link) => {
      console.log(`   - ${link.substring(0, 50)}...`);
    });
    allChecksPassed = false;
  }

  const hasGSAP = html.includes("gsap") || html.includes("GSAP");
  const hasPixi = html.includes("pixi") || html.includes("PIXI");
  console.log(`\n🎨 Dependencies:`);
  console.log(`   GSAP: ${hasGSAP ? "✅" : "⚠️"}`);
  console.log(`   PixiJS: ${hasPixi ? "✅" : "⚠️"}`);

  const hasSDKInit =
    /sdk\.init|sdk\["init"\]|sdk\['init'\]|sdk\.on|["']init["']/.test(html);
  const hasSDKStart =
    /sdk\.start|sdk\["start"\]|sdk\['start'\]|["']start["']/.test(html);
  const hasSDKFinish =
    /sdk\.finish|sdk\["finish"\]|sdk\['finish'\]|["']finish["']/.test(html);
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

  console.log(`\n⚡ Performance:`);
  const hasRequestAnimationFrame = /requestAnimationFrame|rAF/.test(html);
  const hasSetTimeout = /setTimeout|setInterval/.test(html);
  const hasMemoryCheck = /memory|performance|Performance/.test(html);
  console.log(`   Animation frames: ${hasRequestAnimationFrame ? "✅" : "⚠️"}`);
  console.log(`   Timers: ${hasSetTimeout ? "✅" : "⚠️"}`);
  console.log(
    `   Performance monitoring: ${hasMemoryCheck ? "✅" : "⚠️  (recommended)"}`
  );

  const hasGameLogic =
    html.includes("Game") ||
    html.includes("SlotMachine") ||
    html.includes("game.js");
  console.log(
    `\n🎯 Game Logic: ${
      hasGameLogic ? "✅ Detected" : "⚠️  Not clearly detected"
    }`
  );

  const hasAssets =
    html.includes("assets/") ||
    html.includes("sounds/") ||
    html.includes("spritesheets/");
  console.log(
    `📦 Assets: ${hasAssets ? "✅ Detected" : "⚠️  Not clearly detected"}`
  );
} else {
  console.log(`❌ HTML file not found: ${htmlPath}`);
  allChecksPassed = false;
}

console.log(`\n${"=".repeat(50)}`);
if (allChecksPassed) {
  console.log("✅ All checks passed! Ready for Unity Ads.");
  process.exit(0);
} else {
  console.log("❌ Some checks failed. Please review the issues above.");
  process.exit(1);
}
