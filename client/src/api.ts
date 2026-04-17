const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const stripWww = (hostname: string) => hostname.replace(/^www\./i, "");

const envBaseUrl =
	(import.meta.env.VITE_API_BASE_URL as string | undefined) ||
	(import.meta.env.VITE_API_URL as string | undefined);

const resolveApiBaseUrl = () => {
	if (typeof window !== "undefined") {
		if (window.location.hostname === "localhost") {
			if (envBaseUrl && envBaseUrl.trim() !== "") {
				return trimTrailingSlash(envBaseUrl.trim());
			}

			return "http://localhost:5000";
		}

		if (envBaseUrl && envBaseUrl.trim() !== "") {
			const trimmedEnvBaseUrl = trimTrailingSlash(envBaseUrl.trim());

			try {
				const configuredUrl = new URL(trimmedEnvBaseUrl);
				const currentHostname = window.location.hostname;
				const configuredHostname = configuredUrl.hostname;

				if (configuredHostname === currentHostname) {
					return trimmedEnvBaseUrl;
				}

				// Avoid cross-origin redirect/CORS when only www differs.
				if (stripWww(configuredHostname) === stripWww(currentHostname)) {
					return window.location.origin;
				}
			} catch {
				// Fall through and use the raw env value.
			}

			return trimmedEnvBaseUrl;
		}

		// Default to same-origin API on deployed frontend.
		return "";
	}

	if (envBaseUrl && envBaseUrl.trim() !== "") {
		return trimTrailingSlash(envBaseUrl.trim());
	}

	return "";
};

export const API_BASE_URL = resolveApiBaseUrl();

export const apiUrl = (path: string) => {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;

	if (!API_BASE_URL) {
		return normalizedPath;
	}

	return `${API_BASE_URL}${normalizedPath}`;
};

export default API_BASE_URL;
