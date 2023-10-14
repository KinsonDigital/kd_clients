import { CLI } from "../core/CLI.ts";
import { Directory } from "../core/Directory.ts";

const ignoreDirectories = [
	"./vendor/",
	"./node_modules/"
];

const files: string[] = Directory
	.getFiles("/", true)
	.filter(f => {
		const isTypeScriptFile = f.endsWith(".ts");

		const shouldNotIgnore = ignoreDirectories.every(ignoreDir => !f.startsWith(ignoreDir))

		return isTypeScriptFile && shouldNotIgnore;
	});

const cli: CLI = new CLI();
let failed = false;

console.log(`Checking ${files.length} files . . .`);

// Perform a deno check on all of the files
for await (let file of files) {
	const logStart = new TextEncoder().encode(`Checking ${file}`);
	Deno.stdout.writeSync(logStart);
	
	const result = await cli.runAsync(`deno check ${file}`);

	let logEndValue = "";

	// If the result is an error type
	if (result instanceof Error)
	{
		failed = true;
		logEndValue = "❌\n";

		const lines = result.message.split("\n");
		lines.forEach(line => {
			logEndValue += `   ${line}\n`;
		});
	} else {
		logEndValue = "✅\n";
	}

	const logEnd = new TextEncoder().encode(logEndValue);
	Deno.stdout.writeSync(logEnd);
};

if (failed) {
	Deno.exit(1);
}
