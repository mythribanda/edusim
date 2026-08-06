import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "@/config/api";
import { joinUrl } from "@/utils/urlUtils";

const API_BASE = getApiUrl("");

export interface TopicContent {
  class_name: string;
  subject: string;
  chapter: string;
  topic: string;
  outcomes: string[];
  prerequisites: string[];
  topics: string[];
  ai_explanation: string;
  related_concepts: string[];
  related_formulas: any[];
  textbook_content: {
    outcomes: string[];
    prerequisites: string[];
    topics: string[];
  };
  simulation_prompt?: any;
}

export interface UseCurriculumTopicReturn {
  data: TopicContent | null;
  loading: boolean;
  error: string | null;
  fetchTopic: (subject: string, className: string, chapter: string, topic?: string) => Promise<void>;
}

export function useCurriculumTopic(): UseCurriculumTopicReturn {
  const [data, setData] = useState<TopicContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopic = useCallback(
    async (subject: string, className: string, chapter: string, topic?: string) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          subject,
          class_name: className,
          chapter,
          ...(topic && { topic }),
        });

        const response = await fetch(joinUrl(API_BASE, `/api/tutor/topic?${params}`));
        const json = await response.json();

        if (!response.ok || json.error) {
          throw new Error(json.error || "Failed to load topic");
        }

        setData(json);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        console.error("Error fetching topic:", message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, fetchTopic };
}
