import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient } from "../deps.ts";
import { Guard } from "../core/Guard.ts";
import { ReleaseModel } from "../deps.ts";
import { Utils } from "../deps.ts";
import { basename, existsSync } from "../deps.ts";
import { ReleaseError } from "../deps.ts";
import { ReleaseOptions } from "./ReleaseOptions.ts";

/**
 * Provides a client for interacting with GitHub releases.
 */
export class ReleaseClient extends GitHubClient {
	/**
	 * Initializes a new instance of the {@link ReleaseClient} class.
	 * @param ownerName The name of the owner of a repository.
	 * @param repoName The name of a repository.
	 * @param this.repoName The name of a repository.
	 * @param token The GitHub token to use for authentication.
	 * @remarks If no token is provided, then the client will not be authenticated.
	 */
	constructor(ownerName: string, repoName: string, token?: string) {
		const funcName = "ReleaseClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");

		super(ownerName, repoName, token);
	}

	/**
	 * Gets the given {@link page} where each page quantity is the given {@link qtyPerPage},
	 * for a repository with a name that matches the given {@link ReleaseClient}.{@link this.repoName},
	 * @param this.repoName The name of the repository to get the releases for.
	 * @param page The page number of the results to get.
	 * @param qtyPerPage The quantity of results to get per page.
	 * @returns The releases for the given repository and page.
	 * @remarks Does not require authentication if the repository is public.
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 * @throws The {@link ReleaseError} if there was an issue getting the releases.
	 */
	public async getReleases(page: number, qtyPerPage: number): Promise<ReleaseModel[]> {
		const [result, _] = await this.getAllReleases(page, qtyPerPage);

		return result;
	}

	/**
	 * Gets a release for a repository.
	 * @param getByValue The tag or title of the release to get.
	 * @param options Various options to use when getting the release.
	 * @returns The release for a repository.
	 * @throws A {@link ReleaseError} if there was an issue getting the release or if it was not found.
	 */
	public async getRelease(getByValue: string, options?: ReleaseOptions): Promise<ReleaseModel> {
		Guard.isNothing(getByValue, "getRelease", "getByValue");

		getByValue = getByValue.trim();

		const filterPredicate: (item: ReleaseModel) => boolean = (item: ReleaseModel) => {
			return options?.getByTitle === true ? item.name === getByValue : item.tag_name === getByValue;
		};

		const releases = await this.getAllDataUntil<ReleaseModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getAllReleases(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: ReleaseModel[]) => {
				// If a release with the tag has been found, stop getting data.
				return pageOfData.some(filterPredicate);
			},
		);

		const foundRelease: ReleaseModel | undefined = releases.find(filterPredicate);

		if (foundRelease === undefined) {
			const tagOrTitle = options?.getByTitle === true ? "title" : "tag";
			const errorMsg =
				`A release with the ${tagOrTitle} '${getByValue}' for the repository '${this.repoName}' could not be found.`;
			throw new ReleaseError(errorMsg);
		}

		return foundRelease;
	}

	/**
	 * Returns a value indicating whether or not a release is tied to a tag that matches the given {@link tagName},
	 * for a repository with a name that matches the given {@link ReleaseClient}.{@link this.repoName}.
	 * @param tagName The name of the tag tied to the release.
	 * @returns The release for the given repository and name.
	 * @throws The {@link ReleaseError} if there was an issue checking if the release exists.
	 */
	public async releaseExists(tagName: string): Promise<boolean> {
		const funcName = "releaseExists";
		Guard.isNothing(tagName, funcName, "releaseName");

		tagName = tagName.trim();

		const releases = await this.getAllDataUntil<ReleaseModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getAllReleases(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: ReleaseModel[]) => {
				// If a release with the name has been found, stop getting data.
				return pageOfData.some((item: ReleaseModel) => item.tag_name === tagName);
			},
		);

		return releases.find((item: ReleaseModel) => item.tag_name === tagName) != undefined;
	}

	/**
	 * Uploads one or more assets to a release that matches a tag or title by the given {@link toReleaseBy}.
	 * @param toReleaseBy The tag or title of the release to upload the asset to.
	 * @param filePaths One or more relative or fully qualified paths of files to upload.
	 * @param options Various options to use when uploading the asset.
	 * @throws A {@link ReleaseError} if there was an issue uploading the asset.
	 * @returns An asynchronous promise of the operation.
	 */
	public async uploadAssets(toReleaseBy: string, filePaths: string | string[], options?: ReleaseOptions): Promise<void> {
		const funcName = "uploadAsset";
		Guard.isNothing(toReleaseBy, funcName, "toReleaseBy");
		Guard.isNothing(toReleaseBy, funcName, "filePath");

		toReleaseBy = toReleaseBy.trim();

		if (!(await this.releaseExists(toReleaseBy))) {
			const errorMsg = `A release with the tag '${toReleaseBy}' for the repository '${this.repoName}' could not be found.`;
			throw new ReleaseError(errorMsg);
		}

		const filesToUpload = Array.isArray(filePaths) ? filePaths : [filePaths];

		const invalidPaths = filesToUpload.filter((filePath: string) => Utils.isNotFilePath(filePath));

		if (invalidPaths.length > 0) {
			const fileList = invalidPaths.length > 1 ? invalidPaths.join("\n\t") : invalidPaths[0];
			const errorMsg = `The following file paths are not valid file:\n${fileList}`;
			throw new ReleaseError(errorMsg);
		}

		const nonExistentPaths = filesToUpload.filter((filePath: string) => !existsSync(filePath));

		if (nonExistentPaths.length > 0) {
			const fileList = nonExistentPaths.length > 1 ? nonExistentPaths.join("\n\t") : nonExistentPaths[0];
			const errorMsg = `The following file paths do not exist:\n${fileList}`;
			throw new ReleaseError(errorMsg);
		}

		const release = await this.getRelease(toReleaseBy, options);

		// All of the upload work
		const uploadWork: Promise<void | ReleaseError>[] = [];

		// Gather all of the work to be done
		for (const filePath of filesToUpload) {
			uploadWork.push(this.uploadFile(toReleaseBy, filePath, release.id, options?.getByTitle === true));
		}

		// Wait for completion of all the uploads
		const uploadResults = await Promise.all(uploadWork);

		const errors = uploadResults.filter((result: void | ReleaseError) => result instanceof ReleaseError) as ReleaseError[];

		if (errors.length > 0) {
			const errorTitle = errors.length > 1
				? `The following errors occurred uploading the assets:`
				: "There was an error uploading the asset:";

			const errorList = errors.length > 1
				? errors.map((error: ReleaseError) => `\n\t${error.message}`).join("")
				: `\n\t${errors[0].message}`;

			throw new ReleaseError(`${errorTitle}${errorList}`);
		}
	}

	/**
	 * Uploads a file using the given {@link filePath} to a release that matches the given {@link releaseId}.
	 * @param tagOrTitle The tag or title of the release to upload the file to.
	 * @param filePath The path of the file to upload.
	 * @param releaseId The id of the release to upload the file to.
	 * @param options Various options to use when uploading the file.
	 * @throws A {@link ReleaseError} if there was an issue uploading the file.
	 * @returns An asynchronous promise of the operation.
	 */
	private async uploadFile(
		tagOrTitle: string,
		filePath: string,
		releaseId: number,
		getByTitle: boolean,
	): Promise<void | ReleaseError> {
		const file = Deno.readFileSync(filePath);
		const fileName = basename(filePath);

		this.baseUrl = "https://uploads.github.com";
		const queryParams = `?name=${fileName}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/releases/${releaseId}/assets${queryParams}`;

		this.updateOrAdd("Content-Type", "application/octet-stream");
		this.updateOrAdd("Content-Length", file.byteLength.toString());

		const response = await this.requestPOST(url, file);

		if (response.status != GitHubHttpStatusCodes.Created) {
			const errorSection = getByTitle === true ? "title" : "tag";
			const errorMsg =
				`The asset '${fileName}' could not be uploaded to the release with the ${errorSection} '${tagOrTitle}'.`;
			throw new ReleaseError(errorMsg);
		}
	}

	/**
	 * Gets the given {@link page} where each page quantity is the given {@link qtyPerPage},
	 *  for a repository with a name that matches the given {@link ReleaseClient}.{@link this.repoName},
	 * @param this.repoName The name of the repository to get the releases for.
	 * @param page The page number of the results to get.
	 * @param qtyPerPage The quantity of results to get per page.
	 * @returns The releases for the given repository and page.
	 * @remarks Does not require authentication if the repository is public.
	 * The {@link page} value must be greater than 0. If less than 1, the value of 1 will be used.
	 * The {@link qtyPerPage} value must be a value between 1 and 100. If less than 1, the value will
	 * be set to 1, if greater than 100, the value will be set to 100.
	 * @throws The {@link ReleaseError} if there was an issue getting the releases.
	 */
	private async getAllReleases(page: number, qtyPerPage: number): Promise<[ReleaseModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/releases${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.NotFound) {
			let errorMsg = `The releases for the repository owner '${this.ownerName}'`;
			errorMsg += ` and for the repository '${this.repoName}' could not be found.`;

			throw new ReleaseError(errorMsg);
		}

		return [<ReleaseModel[]> await this.getResponseData(response), response];
	}
}
