import { GitHubHttpStatusCodes, OrgMemberRole } from "../core/Enums.ts";
import { GitHubClient } from "../core/GitHubClient.ts";
import { Guard } from "../core/Guard.ts";
import { GitHubVarModel } from "../core/Models/GitHubVarModel.ts";
import { GitHubVariablesModel } from "../core/Models/GitHubVariablesModel.ts";
import { UserModel } from "../core/Models/UserModel.ts";
import { Utils } from "../core/Utils.ts";

/**
 * Provides a client for interacting with issues.
 */
export class OrgClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link OrgClient} class.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(token?: string) {
		super(token);
	}

	/**
	 * Gets a value indicating whether or not an organization exists with a name that matches the given {@link orgName}.
	 * @param orgName The name of the organization.
	 * @returns True if the organization exists; otherwise, false.
	 */
	public async exists(orgName: string): Promise<boolean> {
		Guard.isNullOrEmptyOrUndefined(orgName);

		const url = `${this.baseUrl}/orgs/${orgName}`;
		const response = await this.requestGET(url);

		return response.status === GitHubHttpStatusCodes.OK;
	}

	/**
	 * Gets the given {@link page} of private members for an organization with the {@link qtyPerPage},
	 * where the members have the given member {@link role}.
	 * @param organization The name of the organization.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param role The member role to filter by.
	 * @returns The list of private members for the organization.
	 * @remarks Requires authentication.
	 */
	public async getPrivateMembers(
		organization: string,
		page = 1,
		qtyPerPage = 100,
		role: OrgMemberRole = OrgMemberRole.all,
	): Promise<[UserModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryString = `?role=${role}&page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/orgs/${organization}/members${queryString}`;

		const response = await this.requestGET(url);

		if (response.status != GitHubHttpStatusCodes.OK) {
			let errorMsg = `An error occurred when getting the private members for the organization '${this.organization}'.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		return [await this.getResponseData<UserModel[]>(response), response];
	}

	/**
	 * Gets the given {@link page} of public members for an organization with the {@link qtyPerPage},
	 * where the members have the given member {@link role}.
	 * @param organization The name of the organization.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param role The member role to filter by.
	 * @returns The list of public members for the organization.
	 * @remarks Does not require authentication.
	 */
	public async getPublicMembers(
		organization: string,
		page = 1,
		qtyPerPage = 100,
		role: OrgMemberRole = OrgMemberRole.all,
	): Promise<[UserModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryString = `?role=${role}&page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/orgs/${organization}/public_members${queryString}`;

		const response = await this.requestGET(url);

		if (response.status != GitHubHttpStatusCodes.OK) {
			let errorMsg = `An error occurred when getting the private members for the organization '${this.organization}'.`;
			errorMsg += `\nError: ${response.status}(${response.statusText})`;

			Utils.printAsGitHubError(errorMsg);
			Deno.exit(1);
		}

		return [await this.getResponseData<UserModel[]>(response), response];
	}

	/**
	 * Gets a list of all private members for an organization that has the {@link OrgMemberRole.admin} role.
	 * @param organization The name of the organization.
	 * @returns The list of private members for an organization.
	 * @remarks Requires authentication.
	 */
	public async getPrivateAdminMembers(organization: string): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getPrivateMembers(organization, page, qtyPerPage, OrgMemberRole.admin);
		});
	}

	/**
	 * Gets a list of all private members for an organization that does not have the {@link OrgMemberRole.admin} role.
	 * @param organization The name of the organization.
	 * @returns The list of private members for an organization.
	 * @remarks Requires authentication.
	 */
	public async getPrivateNonAdminMembers(organization: string): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getPrivateMembers(organization, page, qtyPerPage, OrgMemberRole.member);
		});
	}

	/**
	 * Gets a list of all private members for an organization that have any {@link OrgMemberRole.admin} role.
	 * @param organization The name of the organization.
	 * @returns The list of private members for an organization.
	 * @remarks Requires authentication.
	 */
	public async getAllPrivateMembers(organization: string): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getPrivateMembers(organization, page, qtyPerPage, OrgMemberRole.all);
		});
	}

	/**
	 * Gets a list of all public members for an organization that has the {@link OrgMemberRole.admin} role.
	 * @param organization The name of the organization.
	 * @returns The list of public members for an organization.
	 * @remarks Does not require authentication.
	 */
	public async getPublicAdminMembers(organization: string): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getPublicMembers(organization, page, qtyPerPage, OrgMemberRole.admin);
		});
	}

	/**
	 * Gets a list of all public members for an organization that does not have the {@link OrgMemberRole.admin} role.
	 * @param organization The name of the organization.
	 * @returns The list of public members for an organization.
	 * @remarks Does not require authentication.
	 */
	public async getPublicNonAdminMembers(organization: string): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getPublicMembers(organization, page, qtyPerPage, OrgMemberRole.member);
		});
	}

	/**
	 * Gets a list of all public members for an organization that have any {@link OrgMemberRole.admin} role.
	 * @param organization The name of the organization.
	 * @returns The list of public members for an organization.
	 * @remarks Does not require authentication.
	 */
	public async getAllPublicMembers(organization: string): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getPublicMembers(organization, page, qtyPerPage, OrgMemberRole.all);
		});
	}

	/**
	 * Gets a list of all public and private members of an organization no matter which role they have.
	 * @param organization The name of the organization.
	 * @returns The list of members for an organization.
	 * @remarks Requires authentication.
	 */
	public async getAllOrgMembers(organization: string): Promise<UserModel[]> {
		const result: UserModel[] = [];

		const allOrgPrivateMembers = await this.getAllPrivateMembers(organization);
		const allOrgPublicMembers = await this.getAllPublicMembers(organization);

		result.push(...allOrgPrivateMembers);
		result.push(...allOrgPublicMembers);

		return result;
	}

	/**
	 * Gets a list of all public and private members for an organization with a name that
	 * matches the given {@link organization}.
	 * @param organization The name of the organization.
	 * @returns The list of admin members for an organization.
	 */
	public async getAllAdminMembers(organization: string): Promise<UserModel[]> {
		const result: UserModel[] = [];

		const allPrivateOrgMembers = await this.getPrivateAdminMembers(organization);
		const allPublicOrgMembers = await this.getPublicAdminMembers(organization);

		result.push(...allPrivateOrgMembers);
		result.push(...allPublicOrgMembers);

		return result;
	}

	/**
	 * Gets a value indicating whether or not a user with a name that matches the
	 * given {@link username} is a member of the organization.
	 * @param organization The name of the organization.
	 * @param username The username of the user that might exist in the organization.
	 * @returns True if the user is a member of the organization, false otherwise.
	 */
	public async userIsOrgMember(organization: string, username: string): Promise<boolean> {
		const allOrgMembers = await this.getAllOrgMembers(organization);

		return allOrgMembers.some((member) => member.login === username);
	}

	/**
	 * Gets a value indicating whether or not a user with a name that matches the
	 * given {@link username} is a ember of the organization with the admin role.
	 * @param organization The name of the organization.
	 * @param username The username of the user that might exist in the organization.
	 * @returns True if the user is a member of the organization, false otherwise.
	 */
	public async userIsOrgAdminMember(organization: string, username: string): Promise<boolean> {
		const allOrgMembers = await this.getAllAdminMembers(organization);

		return allOrgMembers.some((member) => member.login === username);
	}

	/**
	 * Gets a list of all the organization's variables.
	 * @param organization The name of the organization.
	 * @returns A list of all the organization's variables.
	 */
	public async getVariables(organization: string): Promise<GitHubVarModel[]> {
		Guard.isNullOrEmptyOrUndefined(organization, "getOrgVariables", "organization");

		return await this.getAllData<GitHubVarModel>(async (page: number, qtyPerPage?: number) => {
			const queryString = `?page=${page}&per_page=${qtyPerPage}`;
			const url = `${this.baseUrl}/orgs/${organization}/actions/variables${queryString}`;

			const response = await this.requestGET(url);

			if (response.status != GitHubHttpStatusCodes.OK) {
				let errorMsg = `An error occurred when getting the variables for the organization '${this.organization}'.`;
				errorMsg += `\nError: ${response.status}(${response.statusText})`;

				Utils.printAsGitHubError(errorMsg);
				Deno.exit(1);
			}

			const vars = await this.getResponseData<GitHubVariablesModel>(response);

			return [vars.variables, response];
		});
	}
}
