import path from "node:path";
import { projectRoot } from "./config.mjs";
import { createStaticServer } from "./static-server.mjs";

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const root = path.resolve(projectRoot, argument("--root", "outputs"));
const basePath = argument("--base", "/");
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const server = createStaticServer({ root, basePath, fallbackToIndex: root.endsWith(`${path.sep}outputs`) });

server.listen(port, host, () => {
  console.log(`Musicianship Lab: http://${host}:${port}${basePath}`);
  console.log("Press Ctrl+C to stop.");
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
