const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const envBaseUrl =
	(import.meta.env.VITE_API_BASE_URL as string | undefined) ||
	(import.meta.env.VITE_API_URL as string | undefined);

const resolveApiBaseUrl = () => {
	if (envBaseUrl && envBaseUrl.trim() !== "") {
		return trimTrailingSlash(envBaseUrl.trim());
	}

	if (typeof window !== "undefined") {
		if (window.location.hostname === "localhost") {
			return "http://localhost:5000";
		}

		// Safe production fallback when env is missing in Vercel.
		return "https://gift-and-sons.onrender.com";
	}

	return "https://gift-and-sons.onrender.com";
};

export const API_BASE_URL = resolveApiBaseUrl();

export const apiUrl = (path: string) => {
	const normalizedPath = path.startsWith("/") ? path : `/${path}`;
	return `${API_BASE_URL}${normalizedPath}`;
};

export default API_BASE_URL;
