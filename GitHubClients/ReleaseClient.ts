import { GitHubHttpStatusCodes } from "../core/Enums.ts";
import { GitHubClient, ensureDirSync } from "../deps.ts";
import { Guard } from "../core/Guard.ts";
import { ReleaseModel } from "../deps.ts";
import { Utils } from "../deps.ts";
import { basename, existsSync } from "../deps.ts";
import { ReleaseError } from "../deps.ts";
import { ReleaseOptions } from "./ReleaseOptions.ts";
import { AuthError } from "./Errors/AuthError.ts";
import { AssetModel } from "../core/Models/AssetModel.ts";

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
	 * @throws An {@link Error} if the parameters are undefined, null, or empty.
	 */
	constructor(ownerName: string, repoName: string, token: string) {
		const funcName = "ReleaseClient.ctor";
		Guard.isNothing(ownerName, funcName, "ownerName");
		Guard.isNothing(repoName, funcName, "repoName");
		Guard.isNothing(token, funcName, "token");

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
	 * @throws An {@link AuthError} or {@link ReleaseError}.
	 */
	public async getReleases(page: number, qtyPerPage: number): Promise<ReleaseModel[]> {
		const [result, response] = await this.getAllReleases(page, qtyPerPage);

		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status === GitHubHttpStatusCodes.NotFound) {
			let errorMsg = `The releases for the repository owner '${this.ownerName}'`;
			errorMsg += ` and for the repository '${this.repoName}' could not be found.`;

			throw new ReleaseError(errorMsg);
		}

		return result;
	}

	/**
	 * Gets a release with and id that matches the given {@link releaseId}.
	 * @param releaseId The id of the release.
	 * @returns The release.
	 * @throws An {@link AuthError} or {@link ReleaseError}.
	 */
	public async getReleaseById(releaseId: number): Promise<ReleaseModel> {
		Guard.isLessThanOne(releaseId);

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/releases/${releaseId}`;

		const response = await this.requestGET(url);

		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status !== 200) {
			const errorMsg = `Status Code: ${response.status} ${response.statusText}`;
			throw new Error(errorMsg);
		}

		return await response.json() as ReleaseModel;
	}

	/**
	 * Gets a release with and id that matches the given {@link releaseId}.
	 * @param releaseId The id of the release.
	 * @returns The release.
	 * @throws An {@link AuthError} or {@link ReleaseError}.
	 */
	public async getReleaseByTag(tagName: string): Promise<ReleaseModel> {
		Guard.isNothing(tagName);

		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/releases/tags/${tagName}`;

		const response = await this.requestGET(url);

		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status !== 200) {
			const errorMsg = `Status Code: ${response.status} ${response.statusText}`;
			throw new Error(errorMsg);
		}

		return await response.json() as ReleaseModel;
	}

	/**
	 * Gets a release with a name that matches the given release {@link name}.
	 * @param name The tag or title of the release to get.
	 * @returns The release for a repository.
	 * @remarks The {@link name} is just the release title.
	 * @throws An {@link AuthError} or {@link ReleaseError}.
	 */
	public async getReleaseByName(name: string): Promise<ReleaseModel> {
		Guard.isNothing(name, "getReleaseByName", "name");

		name = name.trim();

		const releases = await this.getAllDataUntil<ReleaseModel>(
			async (page: number, qtyPerPage?: number) => {
				return await this.getAllReleases(page, qtyPerPage ?? 100);
			},
			1, // Start page
			100, // Qty per page
			(pageOfData: ReleaseModel[]) => {
				// If a release with the tag has been found, stop getting data.
				return pageOfData.some((item) => item.name === name);
			},
		);

		const foundRelease: ReleaseModel | undefined = releases.find((item) => item.name === name);

		if (foundRelease === undefined) {
			const errorMsg =
				`A release with the name '${name}' for the repository '${this.repoName}' could not be found.`;
			throw new ReleaseError(errorMsg);
		}

		return foundRelease;
	}

	/**
	 * Returns a value indicating whether or not a release is tied to a tag that matches the given {@link tagName},
	 * for a repository with a name that matches the given {@link ReleaseClient}.{@link this.repoName}.
	 * @param tagName The name of the tag tied to the release.
	 * @returns The release for the given repository and name.
	 * @throws An {@link AuthError} or {@link ReleaseError}.
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

		return releases.find((item: ReleaseModel) => item.tag_name === tagName) !== undefined;
	}

	/**
	 * Uploads one or more assets to a release that matches a tag or title by the given {@link tag}.
	 * @param tag The tag or title of the release to upload the asset to.
	 * @param filePaths One or more relative or fully qualified paths of files to upload.
	 * @throws A {@link ReleaseError} if there was an issue uploading the asset.
	 * @returns An asynchronous promise of the operation.
	 * @throws An {@link AuthError} or {@link ReleaseError}.
	 */
	public async uploadAssetsByReleaseTag(tag: string, filePaths: string | string[]): Promise<void> {
		const funcName = "uploadAssetsByReleaseTag";
		Guard.isNothing(tag, funcName, "tagOrTitle");
		Guard.isNothing(filePaths, funcName, "filePaths");

		tag = tag.trim();

		if (!(await this.releaseExists(tag))) {
			const errorMsg = `A release with the tag '${tag}' for the repository '${this.repoName}' could not be found.`;
			throw new ReleaseError(errorMsg);
		}

		const filesToUpload = Array.isArray(filePaths) ? filePaths.map((p) => p.trim()) : [filePaths.trim()];

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

		const release = await this.getReleaseByTag(tag);

		// All of the upload work
		const uploadWork: Promise<void | ReleaseError>[] = [];

		// Gather all of the work to be done
		for (const filePath of filesToUpload) {
			uploadWork.push(this.uploadFile(filePath, release.id));
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
	 * Uploads one or more assets to a release that matches a tag or title by the given {@link name}.
	 * @param name The tag or title of the release to upload the asset to.
	 * @param filePaths One or more relative or fully qualified paths of files to upload.
	 * @param options Various options to use when uploading the asset.
	 * @throws A {@link ReleaseError} if there was an issue uploading the asset.
	 * @returns An asynchronous promise of the operation.
	 * @throws An {@link AuthError} or {@link ReleaseError}.
	 */
	public async uploadAssetsByReleaseName(name: string, filePaths: string | string[]): Promise<void> {
		const funcName = "uploadAssetsByReleaseName";
		Guard.isNothing(name, funcName, "name");
		Guard.isNothing(filePaths, funcName, "filePaths");

		name = name.trim();

		if (!(await this.releaseExists(name))) {
			const errorMsg = `A release with the tag '${name}' for the repository '${this.repoName}' could not be found.`;
			throw new ReleaseError(errorMsg);
		}

		const filesToUpload = Array.isArray(filePaths) ? filePaths.map((p) => p.trim()) : [filePaths.trim()];

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

		const release = await this.getReleaseByName(name);

		// All of the upload work
		const uploadWork: Promise<void | ReleaseError>[] = [];

		// Gather all of the work to be done
		for (const filePath of filesToUpload) {
			uploadWork.push(this.uploadFile(filePath, release.id));
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
	 * Downloads an asset with an id that matches the given {@link assetId} to the given {@link dirPath}.
	 * @param assetId The id of the asset to download.
	 * @param dirPath The directory path to download the asset to.
	 * @param fileName The name of the file when downloaded.
	 * @param overwrite True to overwrite the file if it exists, otherwise false.
	 * @remarks The {@link fileName} is the name of the file when downloads.  Not the name of the asset.
	 * @throws The following errors:
	 * 1. An {@link Error} if the {@link assetId}, {@link dirPath}, or {@link fileName} are undefined, null, or empty.
	 * 2. An {@link AuthError} if the request is unauthorized.
	 * 3. A {@link ReleaseError} if the asset could not be downloaded.
	 * 4. A {@link ReleaseError} if the file already exists and {@link overwrite} is not set to false.
	 */
	public async downloadAssetById(assetId: number, dirPath: string, fileName: string, overwrite?: boolean): Promise<void> {
		Guard.isNothing(assetId);
		Guard.isNothing(dirPath);
		Guard.isNothing(fileName);

		if (Utils.isNumber(assetId)) {
			Guard.isLessThanOne(assetId);
		}

		dirPath = this.normalizePath(dirPath);
		fileName = basename(fileName.trim());

		const downloadFilePath = `${dirPath}/${fileName}`;

		if (existsSync(downloadFilePath, { isFile: true })) {
			if (overwrite === true) {
				Deno.removeSync(downloadFilePath);
			} else {
				throw new ReleaseError(`The file '${downloadFilePath}' already exists.\nUse 'overwrite = true' to overwrite the file.`);
			}
		}

		const url = `https://api.github.com/repos/${this.ownerName}/${this.repoName}/releases/assets/${assetId}`;

		// Change the default 'Accept' header from 'application/vnd.github+json' to 'application/octet-stream'
		// This is required for download as a file
		this.updateOrAddHeader("Accept", "application/octet-stream");

		const response = await this.requestGET(url);

		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status !== GitHubHttpStatusCodes.OK) {
			const errorMsg = `The asset with the id '${assetId}' could not be downloaded.`;
			throw new ReleaseError(errorMsg);
		}

		ensureDirSync(dirPath);

		const data = await response.blob();
		const arrayBuffer = await data.arrayBuffer();
		const arrayData = new Uint8Array(arrayBuffer);

		Deno.writeFileSync(downloadFilePath, arrayData);
	}

	public async downloadAllAssetsByReleaseTag(tag: string): Promise<void> {
		Guard.isNothing(tag);
	}
	
	public async downloadAllAssetsByReleaseName(name: string): Promise<void> {
		Guard.isNothing(name);
	}

	/**
	 * Gets all assets for a release with the given {@link releaseTagName}.
	 * @param releaseTagName The tag name of the release where the asset lives.
	 * @returns All assets for a release with the given {@link releaseTagName}.
	 * @throws An {@link AuthError} or {@link ReleaseError}.
	 */
	public async getAllAssetsByTag(releaseTagName: string): Promise<AssetModel[]> {
		Guard.isNothing(releaseTagName);

		return (await this.getReleaseByTag(releaseTagName)).assets;
	}

	/**
	 * Gets a single asset with an id or name that matches the given {@link assetIdOrName},
	 * for a release with an id or tag that matches the given {@link releaseIdOrTag}.
	 * @param releaseIdOrTag The release id or tag name.
	 * @param assetIdOrName The asset id or name.
	 * @returns The asset with the given {@link assetIdOrName}.
	 * @throws An {@link AuthError} or {@link ReleaseError}.
	 */
	public async getAsset(releaseIdOrTag: number | string, assetIdOrName: number | string): Promise<AssetModel> {
		Guard.isNothing(releaseIdOrTag);
		Guard.isNothing(assetIdOrName);

		if (Utils.isNumber(releaseIdOrTag)) {
			Guard.isLessThanOne(releaseIdOrTag);
		}

		if (Utils.isNumber(assetIdOrName)) {
			Guard.isLessThanOne(assetIdOrName);
		}

		const release = Utils.isNumber(releaseIdOrTag)
			? await this.getReleaseById(releaseIdOrTag)
			: await this.getReleaseByTag(releaseIdOrTag);

		const foundAsset = release.assets.find((asset) => {
			return Utils.isNumber(assetIdOrName)
				? asset.id === assetIdOrName
				: asset.name === assetIdOrName;
		});

		if (foundAsset === undefined) {
			const assetType = Utils.isNumber(assetIdOrName) ? "id" : "name";
			const errorMsg = `An asset with the ${assetType} '${assetIdOrName}' could not be found.`;

			throw new ReleaseError(errorMsg);
		}

		return foundAsset;
	}

	/**
	 * Normalizes the given {@link path} by removing any trailing slashes and converting backslashes to forward slashes.
	 * @param path The path to normalize.
	 * @returns The normalized path.
	 */
	private normalizePath(path: string): string {
		path = path.trim();
		path = path.replace(/\\/g, "/");
		path = path.endsWith("/") ? path.slice(0, -1) : path;

		return path;
	}

	/**
	 * Uploads a file using the given {@link filePath} to a release that matches the given {@link releaseId}.
	 * @param filePath The path of the file to upload.
	 * @param releaseId The id of the release to upload the file to.
	 * @param options Various options to use when uploading the file.
	 * @throws A {@link ReleaseError} if there was an issue uploading the file.
	 * @returns An asynchronous promise of the operation.
	 * @throws An {@link AuthError} or {@link ReleaseError}.
	 */
	private async uploadFile(
		filePath: string,
		releaseId: number,
	): Promise<void> {
		const file = Deno.readFileSync(filePath);
		const fileName = basename(filePath);

		this.baseUrl = "https://uploads.github.com";
		const queryParams = `?name=${fileName}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/releases/${releaseId}/assets${queryParams}`;

		this.updateOrAddHeader("Content-Type", "application/octet-stream");
		this.updateOrAddHeader("Content-Length", file.byteLength.toString());

		const response = await this.requestPOST(url, file);

		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status !== GitHubHttpStatusCodes.Created) {
			const errorMsg = `The asset '${fileName}' could not be uploaded to the release with the release id '${releaseId}'.`;
			throw new ReleaseError(errorMsg);
		}
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
	 * @throws An {@link AuthError} or {@link ReleaseError}.
	 */
	private async getAllReleases(page: number, qtyPerPage: number): Promise<[ReleaseModel[], Response]> {
		page = page < 1 ? 1 : page;
		qtyPerPage = Utils.clamp(qtyPerPage, 1, 100);

		const queryParams = `?page=${page}&per_page=${qtyPerPage}`;
		const url = `${this.baseUrl}/repos/${this.ownerName}/${this.repoName}/releases${queryParams}`;

		const response: Response = await this.requestGET(url);

		// If there is an error
		if (response.status === GitHubHttpStatusCodes.Unauthorized) {
			throw new AuthError();
		} else if (response.status === GitHubHttpStatusCodes.NotFound) {
			let errorMsg = `The releases for the repository owner '${this.ownerName}'`;
			errorMsg += ` and for the repository '${this.repoName}' could not be found.`;

			throw new ReleaseError(errorMsg);
		}

		return [<ReleaseModel[]> await this.getResponseData(response), response];
	}
}
