import { ReleaseError } from "../GitHubClients/Errors/ReleaseError.ts";
import { ReleaseClient } from "../GitHubClients/ReleaseClient.ts";
import { assertRejects, stub } from "../deps.ts";
import { assertEquals } from "@std/assert/assert-equals";

Deno.test("getReleases |> with_not_found_response |> throws_error", async () => {
	// Arrange
	const ownerName = "KinsonDigital";
	const repoName = "kd_clients";
	const token = "test-token";
	const client = new ReleaseClient(ownerName, repoName, token);
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

Deno.test("updateReleaseById |> with_not_found_response |> throws_error", async () => {
	// Arrange
	const ownerName = "KinsonDigital";
	const repoName = "kd_clients";
	const token = "test-token";
	const client = new ReleaseClient(ownerName, repoName, token);
	const releaseId = 123;
	const text = "test value";
	const stubbedResponse = new Response("", {
		status: 404,
		statusText: "Not Found",
	});

	const expectedMsg = `A release with the release if of '${releaseId}' does not exist.`;

	stub(client, "requestPATCH", (_) => Promise.resolve(stubbedResponse));

	// Act
	const act = async () => await client.updateReleaseById(releaseId, text);

	// Assert
	await assertRejects(act, ReleaseError, expectedMsg);
});

Deno.test("updateReleaseById |> when_not_ok_or_not_found_response |> throws_error", async () => {
	// Arrange
	const ownerName = "KinsonDigital";
	const repoName = "kd_clients";
	const token = "test-token";
	const client = new ReleaseClient(ownerName, repoName, token);
	const releaseId = 123;
	const text = "test value";
	const stubbedResponse = new Response("", {
		status: 400,
		statusText: "whoops",
	});

	const expectedMsg = `Status Code: 400 - whoops`;

	stub(client, "requestPATCH", (_) => Promise.resolve(stubbedResponse));

	// Act
	const act = async () => await client.updateReleaseById(releaseId, text);

	// Assert
	await assertRejects(act, Error, expectedMsg);
});

Deno.test("updateReleaseById |> when_updating_release |> updates_the_release", async () => {
	// Arrange
	const ownerName = "KinsonDigital";
	const repoName = "kd_clients";
	const token = "test-token";
	const client = new ReleaseClient(ownerName, repoName, token);
	const releaseId = 123;
	const text = "test value";
	const stubbedResponse = new Response("", {
		status: 200,
	});

	const spyRequestPATCH = stub(client, "requestPATCH", (_) => Promise.resolve(stubbedResponse));

	// Act
	await client.updateReleaseById(releaseId, text);

	// Assert
	assertEquals(spyRequestPATCH.calls.length, 1);
	assertEquals(spyRequestPATCH.calls[0].args[0], "https://api.github.com/repos/KinsonDigital/kd_clients/releases/123");
	assertEquals(spyRequestPATCH.calls[0].args[1], JSON.stringify({ body: text }));
});
