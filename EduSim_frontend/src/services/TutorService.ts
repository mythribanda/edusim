import { getApiUrl } from "@/config/api";
import { joinUrl } from "@/utils/urlUtils";
import { useAuthStore } from "@/store/useAuthStore";

export interface TutorAnalysisResponse {
  success: boolean;
  data: {
    queryType: string;
    concepts: string[];
    formulas: Array<{
      formula: string;
      name: string;
      topic: string;
      meaning: string;
    }>;
    explanation: string;
    ragContent: Array<{
      title: string;
      content: string;
    }>;
  };
}

const API_BASE = getApiUrl("");

export interface ChatMessage {
  role: "user" | "assistant" | "ai";
  content: string;
}

/**
 * Ensures we have a valid auth token before making API calls.
 * If the current token is expired, attempts a refresh via checkAuth.
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  let token = useAuthStore.getState().token;
  
  if (token) {
    // Quick check if token is expired by decoding the payload
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expMs = (payload.exp || 0) * 1000;
      const nowMs = Date.now();
      // If token expires within 60 seconds, proactively refresh
      if (expMs - nowMs < 60_000) {
        console.log("[TutorService] Token expiring soon, refreshing...");
        const refreshed = await useAuthStore.getState().checkAuth();
        if (refreshed) {
          token = useAuthStore.getState().token;
        } else {
          console.warn("[TutorService] Token refresh failed, proceeding without auth");
          token = null;
        }
      }
    } catch {
      // If we can't parse the token, just use it as-is
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  } else {
    console.warn("[TutorService] No auth token available — chat will not be saved");
  }

  return headers;
}

export const TutorService = {
  analyzeQuery: async (
    query: string, 
    context?: { class_name?: string; subject?: string; chapter?: string; topic?: string },
    history?: ChatMessage[],
    sessionId?: string | null,
    signal?: AbortSignal
  ): Promise<TutorAnalysisResponse & { session_id?: string }> => {
    const body = {
      query,
      class_name: context?.class_name,
      subject: context?.subject,
      chapter: context?.chapter,
      topic: context?.topic,
      history: history ? history.map(h => ({
        role: h.role === "ai" ? "assistant" : h.role,
        content: h.content
      })) : undefined,
      session_id: sessionId || undefined
    };
    
    const headers = await getAuthHeaders();
    
    const response = await fetch(joinUrl(API_BASE, "/api/tutor/analyze"), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(text || "Failed to analyze query");
    }

    return response.json();
  },

  getSessions: async (): Promise<{ success: boolean; sessions: any[] }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(joinUrl(API_BASE, "/api/persistence/tutor/sessions"), {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      throw new Error("Failed to fetch tutor sessions");
    }
    return response.json();
  },

  getSessionMessages: async (sessionId: string): Promise<{ success: boolean; session: any }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(joinUrl(API_BASE, `/api/persistence/tutor/session/${sessionId}`), {
      method: "GET",
      headers,
    });
    if (!response.ok) {
      throw new Error("Failed to fetch session messages");
    }
    return response.json();
  },

  deleteSession: async (sessionId: string): Promise<{ success: boolean; message: string }> => {
    const headers = await getAuthHeaders();
    const response = await fetch(joinUrl(API_BASE, `/api/persistence/tutor/session/${sessionId}`), {
      method: "DELETE",
      headers,
    });
    if (!response.ok) {
      throw new Error("Failed to delete tutor session");
    }
    return response.json();
  },
};
