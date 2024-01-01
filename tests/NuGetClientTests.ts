import { assertEquals } from "../deps.ts";
import { NuGetClient } from "../mod.ts";

Deno.test("ctor |> when-invoked |> creates-and-sets-accept-header", () => {
	// Arrange
	const sut = new NuGetClient();
	
	// Act
	const actual = sut.getHeader("Accept");

	// Assert
	assertEquals(actual, "json");
});
