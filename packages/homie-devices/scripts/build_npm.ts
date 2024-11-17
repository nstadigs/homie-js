// ex. scripts/build_npm.ts
import { build, emptyDir } from "jsr:@deno/dnt";

await emptyDir("./npm");

await build({
  entryPoints: ["./src/mod.ts"],
  outDir: "./npm",
  shims: {
    // see JS docs for overview and more options
    deno: true,
  },
  package: {
    // package.json properties
    name: "@nstadigs/homie-devices",
    version: Deno.args[0],
    description: "Create Homie 5.0 devices with javascript",
    license: "MIT",
    repository: {
      type: "git",
      url: "git+https://github.com/nstadigs/homie-js.git",
    },
    bugs: {
      url: "https://github.com/nstadigs/homie-js/issues",
    },
  },
  postBuild() {
    // steps to run after building and before running the tests
    Deno.copyFileSync("LICENSE", "npm/LICENSE");
    Deno.copyFileSync("README.md", "npm/README.md");
  },
});
