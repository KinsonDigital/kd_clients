import { RepoError } from "../GitHubClients/Errors/RepoError.ts";
import { RepoModel } from "../core/Models/RepoModel.ts";
import { assertEquals, assertRejects, assertSpyCalls, stub } from "../deps.ts";
import { RepoClient } from "../mod.ts";

Deno.test("getRepo |> when_invoked |> gets_repository", async () => {
	// Arrange
	const client = new RepoClient("test-owner", "test-repo", "test-token");
	const data: RepoModel[] = [{
		id: 1,
		name: "test-repo",
		url: "test-url",
	}];
	const response: Response = new Response(null, { status: 200 });

	const myStub = stub(
		client,
		"getOwnerRepos",
		(_page, _qtyPerPage) => Promise.resolve<[RepoModel[], Response]>([data, response]));


	// Act
	const actual = await client.getRepo();

	// Assert
	assertEquals(actual, data[0]);
	assertSpyCalls(myStub, 1);
});

Deno.test("getRepo |> when_repo_does_not_exist |> throws_error", async () => {
	// Arrange
	const client = new RepoClient("test-owner", "test-repo", "test-token");
	const data: RepoModel[] = [{
		id: 1,
		name: "other-repo",
		url: "test-url",
	}];
	const response: Response = new Response(null, { status: 200 });

	stub(client, "getOwnerRepos", (_page, _qtyPerPage) => Promise.resolve<[RepoModel[], Response]>([data, response]));

	// Act & Assert
	await assertRejects(async () => await client.getRepo(), RepoError, "The repository 'test-repo' was not found.");
});
