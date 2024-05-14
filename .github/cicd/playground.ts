import { IssueOrPRState } from "../../core/Enums.ts";
import { IssueModel } from "../../deps.ts";
import { GitClient, IssueClient, LabelClient, MilestoneClient, OrgClient, TagClient } from "../../mod.ts";

const _token = Deno.args[0]; // NOTE: This is coming from the launch.config json file as an environment variable
const _rootRepoDirPath = Deno.args[1];

const client = new TagClient("KinsonDigital", "Velaptor", "_token");


const issues = await client.getAllTags();

debugger;
