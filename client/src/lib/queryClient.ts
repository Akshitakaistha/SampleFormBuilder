import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  options: {
    url: string,
    method: string,
    data?: unknown | undefined,
  } | {
    method: string,
    url: string,
    data?: unknown | undefined,
  }
): Promise<any> {
  const method = options.method;
  const url = options.url;
  const data = 'data' in options ? options.data : undefined;
  
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add authorization token if available
  const token = localStorage.getItem('token');
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  try {
    console.log(`Making API request: ${method} ${url}`);
    
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    const jsonData = await res.json().catch(() => ({}));
    
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

    const res = await fetch(queryKey[0] as string, {
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
