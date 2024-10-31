/**
 * JSR meta data model from calling the 'https://jsr.io/@${scope}/${pkgName}/meta.json' API endpoint.
 */
export interface JsrMetaModel {
	/**
	 * Gets the scope of the package.
	 */
	scope: string,

	/**
	 * Gets the name of the package
	 */
	name: string,

	/**
	 * Gets the latest production version of the package.
	 */
	latest: string | null,

	/**
	 * Gets the versions of the package.
	 */
	versions: {
		"1.0.0-preview.14": Record<string | number | symbol, never>,
		"1.0.0-preview.13": Record<string | number | symbol, never>
	}
}
