// ----IMPORTS----

// Official Deno Modules
import { exists, existsSync } from "https://deno.land/std@0.203.0/fs/exists.ts";
import { extname, basename, isAbsolute } from "https://deno.land/std@0.203.0/path/mod.ts";
import { decodeBase64, encodeBase64 } from "https://deno.land/std@0.203.0/encoding/base64.ts";
import { assert, assertEquals, assertThrows, assertRejects, equal } from "https://deno.land/std@0.204.0/assert/mod.ts";
import { assertSpyCall, assertSpyCalls, spy, stub, returnsNext, returnsArg } from "https://deno.land/std@0.204.0/testing/mock.ts";

// NPM Modules
import chalk from "npm:chalk@4.1.1";
import { TwitterApi, TweetV2PostTweetResult } from "npm:twitter-api-v2@1.15.0";

// ----EXPORTS----

// Official Deno Modules
export { exists, existsSync };
export { extname, basename, isAbsolute };
export { decodeBase64, encodeBase64 };
export { assert, assertEquals, assertThrows, assertRejects, equal };
export { assertSpyCall, assertSpyCalls, spy, stub, returnsNext, returnsArg }

// NPM Modules
export { chalk };
export { TwitterApi };
export type { TweetV2PostTweetResult };
