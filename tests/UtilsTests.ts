import { assertEquals } from "assertions/mod.ts";
import { Utils } from "core/Utils.ts";

Deno.test("clamp_when-num-is-larger-than-max_returns-max-value", () => {
	// Arrange
	const expected = 5;
	const testNumber = 10;

	// Act
	const actual = Utils.clamp(testNumber, 0, 5);

	// Assert
	assertEquals(actual, expected);
});


Deno.test("clamp_when-num-is-smaller-than-max_returns-min-value", () => {
	// Arrange
	const expected = 100;
	const testNumber = 90;

	// Act
	const actual = Utils.clamp(testNumber, 100, 200);

	// Assert
	assertEquals(actual, expected);
});
