import { RepoError } from "../GitHubClients/Errors/RepoError.ts";
import { assertEquals, assertRejects, assertSpyCalls, stub } from "../deps.ts";
import { RepoClient } from "../mod.ts";
import type { FileContentModel, RepoModel } from "../core/Models/mod.ts";

Deno.test("getRepo |> when-invoked |> gets-repository", async () => {
	// Arrange
	const sut = new RepoClient("test-owner", "test-repo", "test-token");
	const data: RepoModel[] = [{
		id: 1,
		name: "test-repo",
		url: "test-url",
	}];

	const getRequestResponse = new Response(JSON.stringify(data), {
		status: 200,
	});

	const spy_requestGET = stub(
		sut,
		"requestGET",
		(_url) => Promise.resolve<Response>(getRequestResponse),
	);

	// Act
	const actual = await sut.getRepo();

	// Assert
	assertEquals(actual, data[0]);
	assertSpyCalls(spy_requestGET, 1);
});

Deno.test("getRepo |> when-repo-does-not-exist |> throws-error", async () => {
	// Arrange
	const sut = new RepoClient("test-owner", "test-repo", "test-token");
	const data: RepoModel[] = [{
		id: 1,
		name: "other-repo",
		url: "test-url",
	}];

	const getRequestResponse = new Response(JSON.stringify(data), {
		status: 200,
	});

	const spy_requestGET = stub(sut, "requestGET", (_url) => Promise.resolve<Response>(getRequestResponse));

	// Act & Assert
	await assertRejects(async () => await sut.getRepo(), RepoError, "The repository 'test-repo' was not found.");
	assertSpyCalls(spy_requestGET, 1);
});

Deno.test("fileExists |> when-branch-name-param-is-nothing |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "The value is null, undefined, or empty.\nFunction Name: fileExists\nParam Name: branchName";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");

	// Act & Assert
	await assertRejects(async () => await sut.fileExists("", "test-path"), Error, expectedErrorMsg);
});

Deno.test("fileExists |> when-file-path-param-is-nothing |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "The value is null, undefined, or empty.\nFunction Name: fileExists\nParam Name: relativeFilePath";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");

	// Act & Assert
	await assertRejects(async () => await sut.fileExists("test-branch", ""), Error, expectedErrorMsg);
});

Deno.test("fileExists |> when-path-is-not-relative-path |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "The relative file path '/dirA/dirB' is not a valid relative file path.";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");

	// Act & Assert
	await assertRejects(async () => await sut.fileExists("test-branch", "/dirA/dirB"), RepoError, expectedErrorMsg);
});

Deno.test("fileExists |> when-path-param-is-not-valid-file-path |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "The relative file path './dirA/dirB' is not a valid directory path.";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");

	// Act & Assert
	await assertRejects(async () => await sut.fileExists("test-branch", "./dirA/dirB"), RepoError, expectedErrorMsg);
});

Deno.test("fileExists |> when-other-http-error-occurs |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "There was a problem checking if the file './dirA/test-file.txt' exists in the" +
		" repository 'test-repo' in the branch 'test-branch'.";

	const sut = new RepoClient("test-owner", "test-repo", "test-token");
	stub(sut, "requestGET", (_url) => Promise.resolve(new Response(null, { status: 403 })));

	// Act & Assert
	await assertRejects(async () => await sut.fileExists("test-branch", "./dirA/test-file.txt"), RepoError, expectedErrorMsg);
});

Deno.test("fileExists |> when-file-does-not-exist |> returns-false", async () => {
	// Arrange
	const sut = new RepoClient("test-owner", "test-repo", "test-token");
	stub(sut, "requestGET", (_url) => Promise.resolve(new Response(null, { status: 404 })));

	// Act
	const actual = await sut.fileExists("test-branch", "./dirA/test-file.txt");

	// Assert
	assertEquals(actual, false);
});

Deno.test("updateFile |> when-branch-name-param-is-nothing |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");
	stub(sut, "fileExists", (_branchName, _relativeFilePath) => Promise.resolve(true));

	// Act & Assert
	await assertRejects(
		async () =>
			await sut.updateFile(
				"",
				"./dirA/test-file.txt",
				"test-content",
				"test-commit",
			),
		Error,
		expectedErrorMsg,
	);
});

Deno.test("updateFile |> when-path-param-is-nothing |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");
	stub(sut, "fileExists", (_branchName, _relativeFilePath) => Promise.resolve(true));

	// Act & Assert
	await assertRejects(
		async () =>
			await sut.updateFile(
				"test-branch",
				"",
				"test-content",
				"test-commit",
			),
		Error,
		expectedErrorMsg,
	);
});

Deno.test("updateFile |> when-file-content-param-is-nothing |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");
	stub(sut, "fileExists", (_branchName, _relativeFilePath) => Promise.resolve(true));

	// Act & Assert
	await assertRejects(
		async () =>
			await sut.updateFile(
				"test-branch",
				"./dirA/test-file.txt",
				"",
				"test-commit",
			),
		Error,
		expectedErrorMsg,
	);
});

Deno.test("updateFile |> when-commit-msg-param-is-nothing |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");
	stub(sut, "fileExists", (_branchName, _relativeFilePath) => Promise.resolve(true));

	// Act & Assert
	await assertRejects(
		async () =>
			await sut.updateFile(
				"test-branch",
				"./dirA/test-file.txt",
				"test-content",
				"",
			),
		Error,
		expectedErrorMsg,
	);
});

Deno.test("updateFile |> when-path-is-not-relative-path |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "The relative file path '/dirA/dirB' is not a valid relative file path.";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");

	// Act & Assert
	await assertRejects(
		async () =>
			await sut.updateFile(
				"test-branch",
				"/dirA/dirB",
				"test-content",
				"test-commit",
			),
		RepoError,
		expectedErrorMsg,
	);
});

Deno.test("updateFile |> when-path-param-is-not-valid-file-path |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "The relative file path './dirA/dirB' is not a valid directory path.";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");

	// Act & Assert
	await assertRejects(
		async () =>
			await sut.updateFile(
				"test-branch",
				"./dirA/dirB",
				"test-content",
				"test-commit",
			),
		RepoError,
		expectedErrorMsg,
	);
});

Deno.test("updateFile |> when-file-does-not-exist |> throws-error", async () => {
	// Arrange
	const expectedErrorMsg = "The file './dirA/test-file.txt' does not exist in the repository 'test-repo'";
	const sut = new RepoClient("test-owner", "test-repo", "test-token");

	stub(sut, "fileExists", (_branchName, _relativeFilePath) => Promise.resolve(false));

	// Act & Assert
	await assertRejects(
		async () =>
			await sut.updateFile(
				"test-branch",
				"./dirA/test-file.txt",
				"test-content",
				"test-commit",
			),
		RepoError,
		expectedErrorMsg,
	);
});

Deno.test("updateFile |> with-non-200-http-status-code |> throws-error", async () => {
	// Arrange
	const relativeFilePath = "./dirA/test-file.txt";
	const expectedErrorMsg =
		`An error occurred when creating the file '${relativeFilePath}' in the repository 'test-repo' for branch 'test-branch'.`;
	const sut = new RepoClient("test-owner", "test-repo", "test-token");

	const fileContent: FileContentModel = {
		name: "test-name",
		path: "test-path",
		size: 123,
		url: "test-url",
		html_url: "test-html-url",
		download_url: "test-download-url",
		content: "test-content",
		sha: "test-sha",
	};

	stub(sut, "requestGET", (_url) => Promise.resolve(new Response(JSON.stringify(fileContent), { status: 500 })));
	stub(sut, "requestPUT", (_url, _body) => Promise.resolve(new Response(null, { status: 500 })));
	stub(sut, "fileExists", (_branchName, _relativeFilePath) => Promise.resolve(true));

	// Act & Assert
	await assertRejects(
		async () =>
			await sut.updateFile(
				"test-branch",
				relativeFilePath,
				"test-content",
				"test-commit",
			),
		RepoError,
		expectedErrorMsg,
	);
});
