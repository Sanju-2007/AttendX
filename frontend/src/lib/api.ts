export const getApiUrl = (path: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (baseUrl) {
    // Remove trailing slash if provided
    return `${baseUrl.replace(/\/$/, "")}${path}`;
  }

  // Local development fallback
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    return `http://${hostname}:5001${path}`;
  }
  return `http://localhost:5001${path}`;
};
