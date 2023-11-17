import { RepoError } from "../GitHubClients/Errors/RepoError.ts";
import { RepoModel } from "../core/Models/mod.ts";
import { assertEquals, assertRejects, assertSpyCalls, stub } from "../deps.ts";
import { RepoClient } from "../mod.ts";

Deno.test("getRepo |> when-invoked |> gets-repository", async () => {
	// Arrange
	const sut = new RepoClient("test-owner", "test-repo", "test-token");
	const data: RepoModel[] = [{
		id: 1,
		name: "test-repo",
		url: "test-url",
	}];
	const response: Response = new Response(null, { status: 200 });

	const spy_getOwnerRepos = stub(
		sut,
		"getOwnerRepos",
		(_page, _qtyPerPage) => Promise.resolve<[RepoModel[], Response]>([data, response]));


	// Act
	const actual = await sut.getRepo();

	// Assert
	assertEquals(actual, data[0]);
	assertSpyCalls(spy_getOwnerRepos, 1);
});

Deno.test("getRepo |> when-repo-does-not-exist |> throws-error", async () => {
	// Arrange
	const sut = new RepoClient("test-owner", "test-repo", "test-token");
	const data: RepoModel[] = [{
		id: 1,
		name: "other-repo",
		url: "test-url",
	}];
	const response: Response = new Response(null, { status: 200 });

	stub(sut, "getOwnerRepos", (_page, _qtyPerPage) => Promise.resolve<[RepoModel[], Response]>([data, response]));

	// Act & Assert
	await assertRejects(async () => await sut.getRepo(), RepoError, "The repository 'test-repo' was not found.");
});
