import { GitHubHttpStatusCodes, OrgMemberRole } from "../core/Enums.ts";
import { GitHubClient } from "../deps.ts";
import { Guard } from "../core/Guard.ts";
import { GitHubVarModel } from "../deps.ts";
import { GitHubVariablesModel } from "../deps.ts";
import { UserModel } from "../deps.ts";
import { Utils } from "../deps.ts";
import { OrganizationError } from "../deps.ts";

/**
 * Provides a client for interacting with issues.
 */
export class OrgClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link OrgClient} class.
	 * @param ownerName The name of the organization.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(ownerName: string, token: string) {
		const funcName = "OrgClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");

		super(ownerName, "na", token);
	}

	/**
	 * Gets a value indicating whether or not an organization exists with a name that matches the given {@link orgName}.
	 * @returns True if the organization exists; otherwise, false.
	 */
	public async exists(): Promise<boolean> {
		const url = `${this.baseUrl}/orgs/${this.ownerName}`;
		const response = await this.requestGET(url);

		return response.status === GitHubHttpStatusCodes.OK;
	}

	/**
	 * Gets the given {@link page} of private members where the quantity of the page is the the given {@link qtyPerPage},
	 * where the members have the given {@link qtyPerPage},
	 * where the members have the given member {@link role}.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param role The member role to filter by.
	 * @returns The list of private members for the organization.
	 * @remarks Requires authentication.
	 */
	public async getPrivateMembers(
		page = 1,
		qtyPerPage = 100,
		role: OrgMemberRole = OrgMemberRole.all,
	): Promise<[UserModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryString = `?role=${role}&page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/orgs/${this.ownerName}/members${queryString}`;

		const response = await this.requestGET(url);

		return [await this.getResponseData<UserModel[]>(response), response];
	}

	/**
	 * Gets the given {@link page} of public members where the quantity of the page is the the given {@link qtyPerPage},
	 * where the members have the given {@link OrgMemberRole.role}.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param role The member role to filter by.
	 * @returns The list of public members for the organization.
	 * @remarks Does not require authentication.
	 */
	public async getPublicMembers(
		page = 1,
		qtyPerPage = 100,
		role: OrgMemberRole = OrgMemberRole.all,
	): Promise<[UserModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryString = `?role=${role}&page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/orgs/${this.ownerName}/public_members${queryString}`;

		const response = await this.requestGET(url);

		return [await this.getResponseData<UserModel[]>(response), response];
	}

	/**
	 * Gets a list of all private members for an organization with a name that matches the {@link OrgClient}.{@link ownerName}
	 * that has the given {@link OrgMemberRole.admin} role.
	 * @returns The list of private members for an organization.
	 * @remarks Requires authentication.
	 * @throws The error {@type OrganizationError} if the request to get private admin members fails.
	 */
	public async getPrivateAdminMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			const [userModels, response] = await this.getPrivateMembers(page, qtyPerPage, OrgMemberRole.admin);

			if (response.status != GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg(
					`An error occurred when getting the private admin members for the organization '${this.ownerName}'.`,
					response,
				);

				throw new OrganizationError(errorMsg);
			}

			return [userModels, response];
		});
	}

	/**
	 * Gets a list of all private members for an organization that matches the {@link OrgClient}.{@link ownerName}
	 * that has the {@link OrgMemberRole.member} role.
	 * @returns The list of private members for an organization.
	 * @remarks Requires authentication.
	 * @throws The error {@link OrganizationError} if the request to get private non-admin members fails.
	 */
	public async getPrivateNonAdminMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			const [users, response] = await this.getPrivateMembers(page, qtyPerPage, OrgMemberRole.member);

			if (response.status != GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg(
					`An error occurred when getting the private non-admin members for the organization '${this.ownerName}'.`,
					response,
				);

				throw new OrganizationError(errorMsg);
			}

			return Promise.resolve([users, response]);
		});
	}

	/**
	 * Gets a list of all private members for an organization with a name that matches the {@link OrgClient}.{@link ownerName}
	 * and has any role.
	 * @returns The list of private members for an organization.
	 * @remarks Requires authentication.
	 * @throws The error {@link OrganizationError} if the request to get all private members fails.
	 */
	public async getAllPrivateMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			const [users, response] = await this.getPrivateMembers(page, qtyPerPage, OrgMemberRole.all);

			if (response.status != GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg(
					`An error occurred when getting the private members for the organization '${this.ownerName}'.`,
					response,
				);

				throw new OrganizationError(errorMsg);
			}

			return Promise.resolve([users, response]);
		});
	}

	/**
	 * Gets a list of all public members for an organization with a name that matches the {@link OrgClient}.{@link ownerName}
	 * and has the given {@link OrgMemberRole.admin} role.
	 * @returns The list of public members for an organization.
	 * @remarks Does not require authentication.
	 * @throws The error {@link OrganizationError} if the request to get all public admin members fails.
	 */
	public async getPublicAdminMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			const [users, response] = await this.getPublicMembers(page, qtyPerPage, OrgMemberRole.admin);

			if (response.status != GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg(
					`An error occurred when getting the public admin members for the organization '${this.ownerName}'.`,
					response,
				);

				throw new OrganizationError(errorMsg);
			}

			return Promise.resolve([users, response]);
		});
	}

	/**
	 * Gets a list of all public members for an organization with a name that matches the {@link OrgClient}.{@link ownerName}
	 * that does not have the given {@link OrgMemberRole.admin} role.
	 * @returns The list of public members for an organization.
	 * @remarks Does not require authentication.
	 * @throws The error {@type OrganizationError} if the request to get all public non-admin members fails.
	 */
	public async getPublicNonAdminMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			const [users, response] = await this.getPublicMembers(page, qtyPerPage, OrgMemberRole.member);

			if (response.status != GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg(
					`An error occurred when getting the public non-admin members for the organization '${this.ownerName}'.`,
					response,
				);

				throw new OrganizationError(errorMsg);
			}

			return Promise.resolve([users, response]);
		});
	}

	/**
	 * Gets a list of all the public members for an organization with a name that has the
	 * given {@link OrgClient}.{@link ownerName} with an {@link OrgMemberRole.admin} role.
	 * @returns The list of public members for an organization.
	 * @remarks Does not require authentication.
	 * @throws The error {@link OrganizationError} if the request to get all public members fails.
	 */
	public async getAllPublicMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			const [users, response] = await this.getPublicMembers(page, qtyPerPage, OrgMemberRole.all);

			if (response.status != GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg(
					`An error occurred when getting the public members for the organization '${this.ownerName}'.`,
					response,
				);

				throw new OrganizationError(errorMsg);
			}

			return Promise.resolve([users, response]);
		});
	}

	/**
	 * Gets a list of all the public and private members with any role for an organization with a name
	 * that matches the {@link OrgClient}.{@link ownerName}.
	 * @returns The list of members for an organization.
	 * @remarks Requires authentication.
	 */
	public async getAllOrgMembers(): Promise<UserModel[]> {
		const result: UserModel[] = [];

		const allOrgPrivateMembers = await this.getAllPrivateMembers();
		const allOrgPublicMembers = await this.getAllPublicMembers();

		result.push(...allOrgPrivateMembers);
		result.push(...allOrgPublicMembers);

		return result;
	}

	/**
	 * Gets a list of all public and private members for an organization with a name that
	 * matches the {@link OrgClient}.{@link ownerName}.
	 * @returns The list of admin members for an organization.
	 */
	public async getAllAdminMembers(): Promise<UserModel[]> {
		const result: UserModel[] = [];

		const allPrivateOrgMembers = await this.getPrivateAdminMembers();
		const allPublicOrgMembers = await this.getPublicAdminMembers();

		result.push(...allPrivateOrgMembers);
		result.push(...allPublicOrgMembers);

		return result;
	}

	/**
	 * Gets a value indicating whether or not a user with a name that matches the
	 * given {@link username}, is a member of an organization with a name that
	 * matches the {@link OrgClient}.{@link ownerName}.
	 * @param username The username of the user that might exist in the organization.
	 * @returns True if the user is a member of the organization, false otherwise.
	 */
	public async userIsOrgMember(username: string): Promise<boolean> {
		const allOrgMembers = await this.getAllOrgMembers();

		return allOrgMembers.some((member) => member.login === username);
	}

	/**
	 * Gets a value indicating whether or not a user with a name that matches the
	 * given {@link username} is a member of an organization with a name that matches,
	 * the {@link OrgClient}.{@link ownerName} and has an admin role.
	 * @param username The username of the user that might exist in the organization.
	 * @returns True if the user is a member of the organization, false otherwise.
	 */
	public async userIsOrgAdminMember(username: string): Promise<boolean> {
		const allOrgMembers = await this.getAllAdminMembers();

		return allOrgMembers.some((member) => member.login === username);
	}

	/**
	 * Gets a list of all the variables for an organization that matches the {@link OrgClient}.{@link ownerName}.
	 * @returns A list of all the organization's variables.
	 */
	public async getVariables(): Promise<GitHubVarModel[]> {
		return await this.getAllData<GitHubVarModel>(async (page: number, qtyPerPage?: number) => {
			const queryString = `?page=${page}&per_page=${qtyPerPage}`;
			const url = `${this.baseUrl}/orgs/${this.ownerName}/actions/variables${queryString}`;

			const response = await this.requestGET(url);

			if (response.status != GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg(
					`An error occurred when getting the variables for the organization '${this.ownerName}'.`,
					response,
				);

				throw new OrganizationError(errorMsg);
			}

			const vars = await this.getResponseData<GitHubVariablesModel>(response);

			return [vars.variables, response];
		});
	}
}
