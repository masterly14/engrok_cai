"use server"

import { VapiClient } from "@vapi-ai/server-sdk";
import { db } from "@/utils";
import { subDays, format } from "date-fns";
import { onBoardUser } from "./user";

interface VoiceAnalytics {
  totalCalls: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  totalCost: number;
  successRate: number; // 0 – 100
}

interface ChatAnalytics {
  totalMessages: number;
  totalSessions: number;
  averageMessagesPerSession: number;
}

export interface DashboardAnalytics {
  voice: VoiceAnalytics;
  chat: ChatAnalytics;
}

export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  /* ----------------------------- Obtain user context ----------------------------- */
  const user = await onBoardUser();
  if (!user) {
    throw new Error("User not found");
  }
  const userId = user.data.id;

  /* ----------------------------- Fetch user agents ------------------------------ */
  const agents = await db.agent.findMany({
    where: {
      userId,
      vapiId: { not: null },
    },
    select: { vapiId: true },
  });
  const agentVapiIds = agents.map((a) => a.vapiId!).filter(Boolean);

  const chatAgents = await db.chatAgent.findMany({
    where: { userId },
    select: { id: true },
  });
  const chatAgentIds = chatAgents.map((c) => c.id);

  /* -------------------------------- Voice (Vapi) -------------------------------- */
  const vapiToken = process.env.VAPI_API_KEY;
  if (!vapiToken) {
    throw new Error("VAPI_API_KEY env var not set");
  }

  const vapiClient = new VapiClient({ token: vapiToken });

  // Fetch calls per assistant to ensure we only get user data
  let calls: any[] = [];
  if (agentVapiIds.length > 0) {
    const callsArrays = await Promise.all(
      agentVapiIds.map((assistantId) =>
        vapiClient.calls.list({ assistantId })
      )
    );
    calls = callsArrays.flat();
  }

  const totalCalls = calls.length;

  const durations = calls.map((c) => {
    if (c.startedAt && c.endedAt) {
      return (
        new Date(c.endedAt as string).getTime() -
        new Date(c.startedAt as string).getTime()
      ) / 1000;
    }
    return 0;
  });

  const totalDurationSeconds = durations.reduce((a, b) => a + b, 0);
  const averageDurationSeconds = totalCalls
    ? totalDurationSeconds / totalCalls
    : 0;

  const totalCost = calls.reduce((acc, curr) => acc + (curr.cost ?? 0), 0);

  const successfulCalls = calls.filter((c) => c.status === "completed").length;
  const successRate = totalCalls ? (successfulCalls / totalCalls) * 100 : 0;

  const voice: VoiceAnalytics = {
    totalCalls,
    totalDurationSeconds,
    averageDurationSeconds,
    totalCost,
    successRate,
  };

  /* ----------------------------- WhatsApp / Chats ----------------------------- */
  let totalMessages = 0;
  let totalSessions = 0;
  if (chatAgentIds.length > 0) {
    totalMessages = await db.message.count({
      where: {
        chatAgentId: {
          in: chatAgentIds,
        },
      },
    });

    totalSessions = await db.chatSession.count({
      where: {
        chatAgentId: {
          in: chatAgentIds,
        },
      },
    });
  }

  const averageMessagesPerSession =
    totalSessions > 0 ? totalMessages / totalSessions : 0;

  const chat: ChatAnalytics = {
    totalMessages,
    totalSessions,
    averageMessagesPerSession,
  };

  return { voice, chat };
};

export interface TimeSeriesDayData {
  date: string; // YYYY-MM-DD
  calls: number;
  callDurationSeconds: number;
  messages: number;
}

export const getDashboardTimeSeries = async (
  days: number = 30
): Promise<TimeSeriesDayData[]> => {
  /* ----------------------------- Obtain user context ----------------------------- */
  const user = await onBoardUser();
  if (!user) {
    throw new Error("User not found");
  }
  const userId = user.data.id;

  /* ----------------------------- Fetch user agents ------------------------------ */
  const agents = await db.agent.findMany({
    where: {
      userId,
      vapiId: { not: null },
    },
    select: { vapiId: true },
  });
  const agentVapiIds = agents.map((a) => a.vapiId!).filter(Boolean);

  const chatAgents = await db.chatAgent.findMany({
    where: { userId },
    select: { id: true },
  });
  const chatAgentIds = chatAgents.map((c) => c.id);

  const end = new Date();
  const start = subDays(end, days - 1); // inclusive

  /* ------------------------------- Calls ------------------------------ */
  const vapiToken = process.env.VAPI_API_KEY;
  if (!vapiToken) {
    throw new Error("VAPI_API_KEY env var not set");
  }
  const vapiClient = new VapiClient({ token: vapiToken });

  let calls: any[] = [];
  if (agentVapiIds.length > 0) {
    const callsArrays = await Promise.all(
      agentVapiIds.map((assistantId) =>
        vapiClient.calls.list({ assistantId })
      )
    );
    calls = callsArrays.flat();
  }

  /* ------------------------------ Messages ---------------------------- */
  let messages: { timestamp: Date }[] = [];
  if (chatAgentIds.length > 0) {
    messages = await db.message.findMany({
      where: {
        chatAgentId: {
          in: chatAgentIds,
        },
        timestamp: {
          gte: start,
        },
      },
      select: {
        timestamp: true,
      },
    });
  }

  /* ------------------------- Prepare time bins ----------------------- */
  const dateMap: Record<string, TimeSeriesDayData> = {};
  for (let i = 0; i < days; i++) {
    const d = subDays(end, i);
    const key = format(d, "yyyy-MM-dd");
    dateMap[key] = {
      date: key,
      calls: 0,
      callDurationSeconds: 0,
      messages: 0,
    };
  }

  /* ---------------------- Aggregate calls ---------------------------- */
  calls.forEach((call) => {
    const startedAt: string | undefined = call.startedAt || call.createdAt;
    if (!startedAt) return;
    const d = new Date(startedAt);
    if (d < start) return;
    const key = format(d, "yyyy-MM-dd");
    if (!dateMap[key]) return;
    dateMap[key].calls += 1;
    if (call.startedAt && call.endedAt) {
      dateMap[key].callDurationSeconds +=
        (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) /
        1000;
    }
  });

  /* -------------------- Aggregate messages --------------------------- */
  messages.forEach((msg) => {
    const d = msg.timestamp;
    const key = format(d, "yyyy-MM-dd");
    if (dateMap[key]) {
      dateMap[key].messages += 1;
    }
  });

  return Object.values(dateMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}; 