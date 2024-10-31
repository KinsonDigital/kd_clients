import { Utils } from "../../../deps.ts";

/**
 * Get the value of an environment variable after checking if it exists.
 * @param name The name of the environment variable.
 * @remarks This function will throw an error if the environment variable does not exist.
 */
const getEnvVar = (name: string, scriptFileName?: string, throwErrorIfMissing: boolean = true): string => {
	const value = (Deno.env.get(name) ?? "").trim();

	if (Utils.isNothing(value) && throwErrorIfMissing) {
		const fileName = Utils.isNothing(scriptFileName) ? "" : `\n\t${scriptFileName}`;
		const errorMsg = `The '${name}' environment variable does not exist.${fileName}`;

		Utils.printError(errorMsg);
		Deno.exit(1);
	}

	return value;
};

export default getEnvVar;
