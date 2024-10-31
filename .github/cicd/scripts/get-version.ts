import getEnvVar from "@cicd/core/GetEnvVar.ts";
import DenoConfig from "../../../deno.json" with { type: "json" };

const scriptFileName = new URL(import.meta.url).pathname.split("/").pop();

const outputFilePath = getEnvVar("GITHUB_OUTPUT", scriptFileName);

Deno.writeTextFileSync(outputFilePath, `version=${DenoConfig.version}\n`);

console.log(`The output 'version' has been set to '${DenoConfig.version}'.`);
