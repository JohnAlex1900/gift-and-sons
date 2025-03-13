const API_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"
    : "https://gift-and-sons.vercel.app"; // Vercel backend URL

export default API_URL;
