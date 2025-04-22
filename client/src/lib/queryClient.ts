import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Function to get the base URL (useful for local development)
const getBaseUrl = () => {
  // Use window.location to determine the current host and protocol
  const protocol = window.location.protocol;
  const host = window.location.host;
  
  // If running on localhost, the server might be on a different port than the client
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return `${protocol}//${host.split(':')[0]}:5000`;
  }
  
  // Otherwise, use the same host
  return `${protocol}//${host}`;
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add authorization token if available
  const token = localStorage.getItem('token');
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  try {
    // Build full URL if it's a relative path
    const fullUrl = url.startsWith('http') ? url : `${getBaseUrl()}${url}`;
    
    console.log(`Making API request: ${method} ${fullUrl}`);
    if (data) {
      console.log(`Request data:`, data);
    }
    
    // Log all request details for debugging
    const requestDetails = {
      method,
      url: fullUrl,
      headers,
      data: data ? JSON.stringify(data) : undefined
    };
    console.log('Full request details:', requestDetails);
    
    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    console.log(`API response status:`, res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'No error text available');
      console.error(`API error (${res.status}):`, errorText);
      throw new Error(`Request failed with status ${res.status}: ${errorText}`);
    }

    // Check if response is empty
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log('Response is not JSON, returning empty object');
      return {};
    }
    
    let jsonData;
    try {
      jsonData = await res.json();
      console.log('API response data:', jsonData);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      return {};
    }
    
    // Check if the response has MongoDB document format with $_doc property
    if (jsonData && jsonData.$__?.activePaths && jsonData._doc) {
      console.log("Converting MongoDB document to plain object");
      return jsonData._doc;
    }
    
    // Check if the response is an array of MongoDB documents
    if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0]?.$__?.activePaths && jsonData[0]?._doc) {
      console.log("Converting array of MongoDB documents to plain objects");
      return jsonData.map(item => item._doc);
    }
    
    return jsonData;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add authorization token if available
    const token = localStorage.getItem('token');
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Build full URL if it's a relative path
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith('http') ? url : `${getBaseUrl()}${url}`;
    
    console.log(`Making query request: GET ${fullUrl}`);

    const res = await fetch(fullUrl, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const jsonData = await res.json();
    
    // Check if the response has MongoDB document format with $_doc property
    if (jsonData && jsonData.$__?.activePaths && jsonData._doc) {
      console.log("Query converting MongoDB document to plain object");
      return jsonData._doc;
    }
    
    // Check if the response is an array of MongoDB documents
    if (Array.isArray(jsonData) && jsonData.length > 0 && jsonData[0]?.$__?.activePaths && jsonData[0]?._doc) {
      console.log("Query converting array of MongoDB documents to plain objects");
      return jsonData.map(item => item._doc);
    }
    
    return jsonData;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
