import { assertEquals, assertRejects, assertSpyCalls, stub } from "../deps.ts";
import { PullRequestClient } from "../GitHubClients/mod.ts";

Deno.test("requestReviewers |> with-pr-number-less-than-one |> throws-error", async () => {
	// Arrange
	const sut = new PullRequestClient("test-owner", "test-repo", "test-token");

	// Act & Assert
	await assertRejects(async () => await sut.requestReviewers(0, "test-reviewers"));
});

Deno.test("requestReviewers |> with-undefined-reviewers |> throws-error", async () => {
	// Arrange
	const sut = new PullRequestClient("test-owner", "test-repo", "test-token");

	const reviewers: string = undefined!;

	// Act & Assert
	await assertRejects(async () => await sut.requestReviewers(123, reviewers));
});

Deno.test("requestReviewers |> when-using-single-reviewer-name |> adds-reviewer-to-pr", async () => {
	// Arrange
	const sut = new PullRequestClient("test-owner", "test-repo", "test-token");

	const spy_requestPOST = stub(
		sut,
		"requestPOST",
		(_url, _body) => {
			assertEquals(_url, "https://api.github.com/repos/test-owner/test-repo/pulls/123/requested_reviewers");
			assertEquals(_body, '{"reviewers":["test-reviewer"]}');

			return Promise.resolve(new Response(null, { status: 201 }));
		},
	);

	// Act
	await sut.requestReviewers(123, "test-reviewer");

	// Assert
	assertSpyCalls(spy_requestPOST, 1);
});

Deno.test("requestReviewers |> when-using-multiple-reviewer-names |> adds-all-reviewers-to-pr", async () => {
	// Arrange
	const sut = new PullRequestClient("test-owner", "test-repo", "test-token");

	const spy_requestPOST = stub(
		sut,
		"requestPOST",
		(_url, _body) => {
			assertEquals(_url, "https://api.github.com/repos/test-owner/test-repo/pulls/456/requested_reviewers");
			assertEquals(_body, '{"reviewers":["test-reviewer-1","test-reviewer-2"]}');

			return Promise.resolve(new Response(null, { status: 201 }));
		},
	);

	const reviewers: string[] = ["test-reviewer-1", "test-reviewer-2"];

	// Act
	await sut.requestReviewers(456, reviewers);

	// Assert
	assertSpyCalls(spy_requestPOST, 1);
});
