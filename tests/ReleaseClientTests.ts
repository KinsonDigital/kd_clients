import { ReleaseError } from "../GitHubClients/Errors/ReleaseError.ts";
import { ReleaseClient } from "../GitHubClients/ReleaseClient.ts";
import { assertRejects, stub } from "../deps.ts";

Deno.test("getReleases |> with_not_found_response |> throws_error", async () => {
	// Arrange
	const ownerName = "KinsonDigital";
	const repoName = "kd_clients";
	const client = new ReleaseClient(ownerName, repoName);
	const stubbedResponse = new Response("", {
		status: 404,
		statusText: "Not Found",
	});

	let expectedMsg = `The releases for the repository owner '${ownerName}'`;
	expectedMsg += ` and for the repository '${repoName}' could not be found.`;

	stub(client, "requestGET", (_) => Promise.resolve(stubbedResponse));

	// Act
	const act = async () => await client.getReleases(1, 10);

	// Assert
	await assertRejects(act, ReleaseError, expectedMsg);
});
