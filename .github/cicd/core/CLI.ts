/**
 * A simple CLI command wrapper.
 */
export class CLI {
	/**
	 * Runs the following CLI {@link command}.
	 * @param command The command to run.
	 * @returns The output of the command if successful, otherwise an error.
	 */
	public async runAsync(command: string): Promise<string | Error> {
		if (command === undefined || command === null || command === "") {
			const errorMsg = "The command parameter cannot be null or empty.";
			console.log(errorMsg);
			Deno.exit(1);
		}

		command = command.includes("'")
			? command.replace(/'/g, '"')
			: command;

		const sections: string[] = command.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) ?? [];

		const app = sections[0] === "deno" ? Deno.execPath() : sections[0];
		const args = sections.slice(1).map(arg => arg.replace(/"/g, ''));

		const cmd = new Deno.Command(app, { args: args });

		const { code, stdout, stderr } = await cmd.output();

		if (code === 0) {
			return new TextDecoder().decode(stdout);
		} else {
			return new Error(new TextDecoder().decode(stderr));
		}
	}
}
