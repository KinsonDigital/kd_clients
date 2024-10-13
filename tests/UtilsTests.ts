import { assertEquals } from "../deps.ts";
import { Utils } from "../deps.ts";
import type { TestDataArgs } from "./TestTypes.ts";

Deno.test("clamp |> when-num-is-larger-than-max |> returns-max-value", () => {
	// Arrange
	const expected = 5;
	const testNumber = 10;

	// Act
	const actual = Utils.clamp(testNumber, 0, 5);

	// Assert
	assertEquals(actual, expected);
});

Deno.test("clamp |> when-num-is-smaller-than-max |> returns-min-value", () => {
	// Arrange
	const expected = 100;
	const testNumber = 90;

	// Act
	const actual = Utils.clamp(testNumber, 100, 200);

	// Assert
	assertEquals(actual, expected);
});

Deno.test("invalidReleaseType |> with-invalid-type |> returns-true", () => {
	// Arrange
	const invalidValue = "is_invalid";

	// Act
	const actual = Utils.invalidReleaseType(invalidValue);

	// Assert
	assertEquals(actual, true);
});

Deno.test("invalidReleaseType |> with-valid-preview-type |> returns-false", () => {
	// Arrange
	const validValue = "preview";

	// Act
	const actual = Utils.invalidReleaseType(validValue);

	// Assert
	assertEquals(actual, false);
});

Deno.test("invalidReleaseType |> with-valid-prod-type |> returns-false", () => {
	// Arrange
	const validValue = "production";

	// Act
	const actual = Utils.invalidReleaseType(validValue);

	// Assert
	assertEquals(actual, false);
});

Deno.test("isPreviewRelease  |> > with-valid-type  |> > returns-true", () => {
	// Arrange
	const invalidValue = "preview";

	// Act
	const actual = Utils.isPreviewRelease(invalidValue);

	// Assert
	assertEquals(actual, true);
});

Deno.test("isPreviewRelease  |> with-invalid-type  |> returns-false", () => {
	// Arrange
	const invalidValue = "invalid";

	// Act
	const actual = Utils.isPreviewRelease(invalidValue);

	// Assert
	assertEquals(actual, false);
});

Deno.test("isProductionRelease  |> > with-valid-type |> returns-true", () => {
	// Arrange
	const validValue = "production";

	// Act
	const actual = Utils.isProductionRelease(validValue);

	// Assert
	assertEquals(actual, true);
});

Deno.test("isProductionRelease |> with-invalid-type |> returns-false", () => {
	// Arrange
	const invalidValue = "invalid";

	// Act
	const actual = Utils.isProductionRelease(invalidValue);

	// Assert
	assertEquals(actual, false);
});

Deno.test("isFilePath |> when-invoked |> returns-correct-result", () => {
	// Test Data Args
	const testData: TestDataArgs<[string], boolean>[] = [
		[["C:/dirA/dirB/fileA"], false],
		[["C:/dirA/dirB/fileAtxt"], false],
		[["C:/dirA/dirB/fileA/"], false],
		[["C:/dirA/dirB/fileA.txt"], true],
	];

	for (const [args, expected] of testData) {
		// Arrange
		const [path] = args;

		// Act
		const actual = Utils.isFilePath(path);

		// Assert
		assertEquals(actual, expected);
	}
});

Deno.test("isNotFilePath |> when-invoked |> returns-correct-result", () => {
	// Test Data Args
	const testData: TestDataArgs<[string], boolean>[] = [
		[["C:/dirA/dirB/fileA"], true],
		[["C:/dirA/dirB/fileAtxt"], true],
		[["C:/dirA/dirB/fileA/"], true],
		[["C:/dirA/dirB/fileA.txt"], false],
	];

	for (const [args, expected] of testData) {
		// Arrange
		const [path] = args;

		// Act
		const actual = Utils.isNotFilePath(path);

		// Assert
		assertEquals(actual, expected);
	}
});

Deno.test("isDirPath |> when-invoked |> returns-correct-result", () => {
	// Test Data Args
	const testData: TestDataArgs<[string], boolean>[] = [
		[["C:/dirA/dirB/fileA.txt"], false],
		[["C:/dirA/dirB"], true],
		[["C:/dirA/dirB/"], true],
	];

	for (const [args, expected] of testData) {
		// Arrange
		const [path] = args;

		// Act
		const actual = Utils.isDirPath(path);

		// Assert
		assertEquals(actual, expected);
	}
});

Deno.test("isNotDirPath |> when-invoked |> returns-correct-result", () => {
	// Test Data Args
	const testData: TestDataArgs<[string], boolean>[] = [
		[["C:/dirA/dirB/fileA.txt"], true],
		[["C:/dirA/dirB"], false],
		[["C:/dirA/dirB/"], false],
	];

	for (const [args, expected] of testData) {
		// Arrange
		const [path] = args;

		// Act
		const actual = Utils.isNotDirPath(path);

		// Assert
		assertEquals(actual, expected);
	}
});
