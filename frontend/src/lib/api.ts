export const getApiUrl = (path: string): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Use the same hostname as the frontend to prevent Safari CORS/cookie mismatch issues
    const port = "5001";
    return `http://${hostname}:${port}${path}`;
  }
  return `http://localhost:5001${path}`;
};
