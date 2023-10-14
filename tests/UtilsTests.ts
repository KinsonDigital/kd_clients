import { assertEquals } from "../deps.ts";
import { Utils } from "../core/Utils.ts";

Deno.test("clamp |> when_num_is_larger_than_max |> returns_max_value", () => {
	// Arrange
	const expected = 5;
	const testNumber = 10;

	// Act
	const actual = Utils.clamp(testNumber, 0, 5);

	// Assert
	assertEquals(actual, expected);
});


Deno.test("clamp |> when_num_is_smaller_than_max |> returns_min_value", () => {
	// Arrange
	const expected = 100;
	const testNumber = 90;

	// Act
	const actual = Utils.clamp(testNumber, 100, 200);

	// Assert
	assertEquals(actual, expected);
});


Deno.test("invalidReleaseType |> with_invalid_type |> returns_true", () => {
	// Arrange
	const invalidValue = "is_invalid";

	// Act
	const actual = Utils.invalidReleaseType(invalidValue);

	// Assert
	assertEquals(actual, true);
});

Deno.test("invalidReleaseType |> with_valid_preview_type |> returns_false", () => {
	// Arrange
	const validValue = "preview";

	// Act
	const actual = Utils.invalidReleaseType(validValue);

	// Assert
	assertEquals(actual, false);
});


Deno.test("invalidReleaseType |> with_valid_prod_type |> returns_false", () => {
	// Arrange
	const validValue = "production";

	// Act
	const actual = Utils.invalidReleaseType(validValue);

	// Assert
	assertEquals(actual, false);
});

Deno.test("isPreviewRelease  |> > with_valid_type  |> > returns_true", () => {
	// Arrange
	const invalidValue = "preview";

	// Act
	const actual = Utils.isPreviewRelease(invalidValue);

	// Assert
	assertEquals(actual, true);
});

Deno.test("isPreviewRelease  |> with_invalid_type  |> returns_false", () => {
	// Arrange
	const invalidValue = "invalid";

	// Act
	const actual = Utils.isPreviewRelease(invalidValue);

	// Assert
	assertEquals(actual, false);
});

Deno.test("isProductionRelease  |> > with_valid_type |> returns_true", () => {
	// Arrange
	const validValue = "production";

	// Act
	const actual = Utils.isProductionRelease(validValue);

	// Assert
	assertEquals(actual, true);
});

Deno.test("isProductionRelease |> with_invalid_type |> returns_false", () => {
	// Arrange
	const invalidValue = "invalid";

	// Act
	const actual = Utils.isProductionRelease(invalidValue);

	// Assert
	assertEquals(actual, false);
});
