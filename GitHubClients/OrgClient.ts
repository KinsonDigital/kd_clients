import { GitHubHttpStatusCodes, OrgMemberRole } from "../core/Enums.ts";
import { AuthError, GitHubClient } from "../deps.ts";
import { Guard } from "../core/Guard.ts";
import { Utils } from "../deps.ts";
import { OrganizationError } from "../deps.ts";
import type { GitHubVarModel } from "../deps.ts";
import type { GitHubVariablesModel } from "../deps.ts";
import type { UserModel } from "../deps.ts";
import type { VariableOptions } from "./VariableOptions.ts";
import type { TransformType } from "../core/Types.ts";

/**
 * Represents the type of member visibility in a GitHub organization.
 */
type MemberVisibility = "public" | "private";

/**
 * Provides a client for interacting with issues.
 */
export class OrgClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link OrgClient} class.
	 * @param ownerName The name of the organization.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 * @throws An {@link Error} if the parameters are undefined, null, or empty.
	 */
	constructor(ownerName: string, token: string) {
		const funcName = "OrgClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");

		super(ownerName, "na", token);
	}

	/**
	 * Gets a value indicating whether or not an organization exists with a name that matches the given {@link orgName}.
	 * @returns True if the organization exists; otherwise, false.
	 * @throws An {@link AuthError}.
	 */
	public async exists(): Promise<boolean> {
		const url = `${this.baseUrl}/orgs/${this.ownerName}`;
		const response = await this.requestGET(url);

		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		}

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
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getPrivateMembers(
		page = 1,
		qtyPerPage = 100,
		role: OrgMemberRole = OrgMemberRole.all,
	): Promise<UserModel[]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getAll("private", page, qtyPerPage, role);
		});
	}

	/**
	 * Gets the given {@link page} of public members where the quantity of the page is the the given {@link qtyPerPage},
	 * where the members have the given {@link OrgMemberRole.role}.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param role The member role to filter by.
	 * @returns The list of public members for the organization.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getPublicMembers(
		page = 1,
		qtyPerPage = 100,
		role: OrgMemberRole = OrgMemberRole.all,
	): Promise<UserModel[]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getAll("public", page, qtyPerPage, role);
		});
	}

	/**
	 * Gets a list of all private members for an organization with a name that matches the {@link OrgClient}.{@link ownerName}
	 * that has the given {@link OrgMemberRole.admin} role.
	 * @returns The list of private members for an organization.
	 * @remarks Requires authentication.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getPrivateAdminMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getAll("private", page, qtyPerPage, OrgMemberRole.admin);
		});
	}

	/**
	 * Gets a list of all private members for an organization that matches the {@link OrgClient}.{@link ownerName}
	 * that has the {@link OrgMemberRole.member} role.
	 * @returns The list of private members for an organization.
	 * @remarks Requires authentication.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getPrivateNonAdminMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getAll("private", page, qtyPerPage, OrgMemberRole.member);
		});
	}

	/**
	 * Gets a list of all private members for an organization with a name that matches the {@link OrgClient}.{@link ownerName}
	 * and has any role.
	 * @returns The list of private members for an organization.
	 * @remarks Requires authentication.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getAllPrivateMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getAll("private", page, qtyPerPage, OrgMemberRole.all);
		});
	}

	/**
	 * Gets a list of all public members for an organization with a name that matches the {@link OrgClient}.{@link ownerName}
	 * and has the given {@link OrgMemberRole.admin} role.
	 * @returns The list of public members for an organization.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getPublicAdminMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getAll("public", page, qtyPerPage, OrgMemberRole.admin);
		});
	}

	/**
	 * Gets a list of all public members for an organization with a name that matches the {@link OrgClient}.{@link ownerName}
	 * that does not have the given {@link OrgMemberRole.admin} role.
	 * @returns The list of public members for an organization.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getPublicNonAdminMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getAll("public", page, qtyPerPage, OrgMemberRole.member);
		});
	}

	/**
	 * Gets a list of all the public members for an organization with a name that has the
	 * given {@link OrgClient}.{@link ownerName} with an {@link OrgMemberRole.admin} role.
	 * @returns The list of public members for an organization.
	 * @remarks Does not require authentication.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getAllPublicMembers(): Promise<UserModel[]> {
		return await this.getAllData<UserModel>(async (page: number, qtyPerPage?: number) => {
			return await this.getAll("public", page, qtyPerPage, OrgMemberRole.all);
		});
	}

	/**
	 * Gets a list of all the public and private members with any role for an organization with a name
	 * that matches the {@link OrgClient}.{@link ownerName}.
	 * @returns The list of members for an organization.
	 * @remarks Requires authentication.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getAllOrgMembers(): Promise<UserModel[]> {
		const result: UserModel[] = [];

		const allOrgMembers = await Promise.all([this.getAllPublicMembers(), this.getAllPrivateMembers()]);

		result.push(...allOrgMembers[0]);
		result.push(...allOrgMembers[1]);

		return result;
	}

	/**
	 * Gets a list of all public and private members for an organization with a name that
	 * matches the {@link OrgClient}.{@link ownerName}.
	 * @returns The list of admin members for an organization.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getAllAdminMembers(): Promise<UserModel[]> {
		const result: UserModel[] = [];

		const allAdminMembers = await Promise.all([this.getPublicAdminMembers(), this.getPrivateAdminMembers()]);

		result.push(...allAdminMembers[0]);
		result.push(...allAdminMembers[1]);

		return result;
	}

	/**
	 * Gets a value indicating whether or not a user with a name that matches the
	 * given {@link username}, is a member of an organization with a name that
	 * matches the {@link OrgClient}.{@link ownerName}.
	 * @param username The username of the user that might exist in the organization.
	 * @returns True if the user is a member of the organization, false otherwise.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async userIsOrgMember(username: string): Promise<boolean> {
		const allOrgMembers = await this.getAllOrgMembers();

		return allOrgMembers.some((member) => member.login === username);
	}

	/**
	 * Gets a value indicating whether or not a public or private user with a name that matches the
	 * given {@link username} is a member of an organization with a name that matches,
	 * the {@link OrgClient}.{@link ownerName} and has an admin role.
	 * @param username The username of the user that might exist in the organization.
	 * @returns True if the user is a member of the organization, false otherwise.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async userIsOrgAdminMember(username: string): Promise<boolean> {
		const allOrgMembers = await this.getAllAdminMembers();

		return allOrgMembers.some((member) => member.login === username);
	}

	/**
	 * Gets a list of all the variables for an organization that matches the {@link OrgClient}.{@link ownerName}.
	 * @param options The options to use when getting the variables.
	 * @returns A list of all the organization's variables.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	public async getVariables(options?: VariableOptions | VariableOptions[]): Promise<GitHubVarModel[]> {
		return await this.getAllData<GitHubVarModel>(async (page: number, qtyPerPage?: number) => {
			const queryString = `?page=${page}&per_page=${qtyPerPage}`;
			const url = `${this.baseUrl}/orgs/${this.ownerName}/actions/variables${queryString}`;

			const response = await this.requestGET(url);

			if (response.status === GitHubHttpStatusCodes.Unauthorized) {
				throw new AuthError();
			} else if (response.status !== GitHubHttpStatusCodes.OK) {
				const errorMsg = this.buildErrorMsg(
					`An error occurred when getting the variables for the organization '${this.ownerName}'.`,
					response,
				);

				throw new OrganizationError(errorMsg);
			}

			const vars = await this.getResponseData<GitHubVariablesModel>(response);

			const transform = (trimType: TransformType, value: string): string => {
				switch (trimType) {
					case "TrimStart":
						return value.trimStart();
					case "TrimEnd":
						return value.trimEnd();
					case "TrimBoth":
						return value.trim();
					case "UpperCase":
						return value.toUpperCase();
					case "LowerCase":
						return value.toLowerCase();
					default:
						return Utils.isNothing(value) ? "" : value;
				}
			};

			vars.variables.forEach((variable) => {
				if (!Utils.isNothing(options)) {
					if (Array.isArray(options.transformType)) {
						options.transformType.forEach((transformType) => {
							variable.value = transform(transformType, variable.value);
						});
					} else {
						variable.value = transform(options.transformType, variable.value);
					}
				}
			});

			return [vars.variables, response];
		});
	}

	/**
	 * Gets the given {@link page} of public or private members where the quantity of the page is the the given {@link qtyPerPage},
	 * where the members have the given {@link qtyPerPage},
	 * where the members have the given member {@link role}.
	 * @param page The page of results to return.
	 * @param qtyPerPage The total to return per {@link page}.
	 * @param role The member role to filter by.
	 * @returns The list of private members for the organization.
	 * @remarks Requires authentication.
	 * @throws An {@link AuthError} or {@link OrganizationError}.
	 */
	private async getAll(
		privateOrPublic: MemberVisibility,
		page = 1,
		qtyPerPage = 100,
		role: OrgMemberRole = OrgMemberRole.all,
	): Promise<[UserModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryString = `?role=${role}&page=${page}&per_page=${qtyPerPage}`;
		const visibility = privateOrPublic === "public" ? "public_members" : "";
		const url = `${this.baseUrl}/orgs/${this.ownerName}/${visibility}${queryString}`;

		const response = await this.requestGET(url);

		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status !== GitHubHttpStatusCodes.OK) {
			const errorMsg = this.buildErrorMsg(
				`An error occurred when getting the private members for the organization '${this.ownerName}'.`,
				response,
			);

			throw new OrganizationError(errorMsg);
		}

		return [await this.getResponseData<UserModel[]>(response), response];
	}
}
