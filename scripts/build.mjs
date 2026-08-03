import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { projectRoot, readDeploymentConfig } from "./config.mjs";

const sourcePath = path.join(projectRoot, "outputs", "index.html");
const outputDirectory = path.join(projectRoot, "dist");
const indexPath = path.join(outputDirectory, "index.html");
const config = await readDeploymentConfig();
const html = await readFile(sourcePath, "utf8");

if (!/^<!doctype html>/i.test(html) || !html.includes("<title>Musicianship Lab</title>")) {
  throw new Error("outputs/index.html does not look like the Musicianship Lab application.");
}

const unsafeAssetReferences = [
  /(?:src|href)\s*=\s*["']\/(?!\/)/i,
  /url\(\s*["']?\/(?!\/)/i
];
if (unsafeAssetReferences.some(pattern => pattern.test(html))) {
  throw new Error(`A root-relative asset reference would escape the production base path ${config.basePath}.`);
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await copyFile(sourcePath, indexPath);
await writeFile(path.join(outputDirectory, ".nojekyll"), "", "utf8");

for (const route of config.directRoutes) {
  const routeDirectory = path.join(outputDirectory, ...route.split("/").filter(Boolean));
  await mkdir(routeDirectory, { recursive: true });
  await copyFile(sourcePath, path.join(routeDirectory, "index.html"));
}

console.log(`Built Musicianship Lab for ${config.publicUrl}`);
console.log(`Published ${1 + config.directRoutes.length} HTML entry points in dist/.`);
