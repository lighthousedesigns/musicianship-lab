import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { projectRoot, readDeploymentConfig } from "./config.mjs";

const config = await readDeploymentConfig();
const distDirectory = path.join(projectRoot, "dist");
const builtIndex = await readFile(path.join(distDirectory, "index.html"), "utf8");
await stat(path.join(distDirectory, ".nojekyll"));

if (!builtIndex.includes("<title>Musicianship Lab</title>") || !builtIndex.includes("window.__voiceLeadingTrainerTests")) {
  throw new Error("The production artifact is missing the application test interface.");
}

for (const route of config.directRoutes) {
  const routeIndex = path.join(distDirectory, ...route.split("/").filter(Boolean), "index.html");
  const routeHtml = await readFile(routeIndex, "utf8");
  if (routeHtml !== builtIndex) {
    throw new Error(`The direct route ${config.basePath}${route} does not contain the production application.`);
  }
}

const expectedRouteTokens = [
  "keyboard.chord_practice",
  "fretboard.voice_leading",
  "fretboard.triad_shapes.study",
  "fretboard.triad_shapes.quiz"
];
for (const token of expectedRouteTokens) {
  if (!builtIndex.includes(token)) throw new Error(`The production application is missing route token ${token}.`);
}

console.log(`PASS: GitHub Pages artifact is valid for ${config.basePath} and ${config.directRoutes.length} physical direct routes.`);
