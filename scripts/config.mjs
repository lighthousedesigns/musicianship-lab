import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function readDeploymentConfig() {
  const configPath = path.join(projectRoot, "deployment.config.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));

  if (config.repositoryName !== "musicianship-lab") {
    throw new Error("deployment.config.json must use the repository name musicianship-lab.");
  }
  if (config.basePath !== "/musicianship-lab/") {
    throw new Error("deployment.config.json must use the base path /musicianship-lab/.");
  }
  if (config.publicUrl !== "https://lighthousedesigns.github.io/musicianship-lab/") {
    throw new Error("deployment.config.json contains an unexpected public URL.");
  }
  if (!Array.isArray(config.directRoutes) || config.directRoutes.some(route => route.startsWith("/") || route.includes(".."))) {
    throw new Error("deployment.config.json contains an invalid direct route.");
  }

  return config;
}
