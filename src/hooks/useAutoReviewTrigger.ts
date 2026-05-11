"use client";

// NOTE: This hook uses setTimeout for scheduling — suitable for demos/dev.
// In production, replace with a Vercel Cron Job or Supabase Edge Function
// so sends survive page reloads and tab closures.

import { useState, useCallback } from "react";
import { useReviewSettings } from "./useReviewSettings";
import { useMessageTemplates } from "./useMessageTemplates";
import { useReviewRequests } from "./useReviewRequests";

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export interface PendingToast {
  id: string;
  customerName: string;
  delayMinutes: number;
  scheduledAt: string;
}

interface CancelToken {
  cancelled: boolean;
}

const cancelTokens = new Map<string, CancelToken>();

export function useAutoReviewTrigger() {
  const { settings } = useReviewSettings();
  const { templates } = useMessageTemplates();
  const { addRequest } = useReviewRequests();
  const [pendingToasts, setPendingToasts] = useState<PendingToast[]>([]);

  const trigger = useCallback(
    (customer: {
      name: string;
      phone: string;
      customerId: string;
      triggerId?: string;
    }) => {
      if (!settings.autoSendEnabled) return;

      const defaultPlatform =
        settings.platforms.find((p) => p.isDefault && p.isActive && p.url) ??
        settings.platforms.find((p) => p.isActive && p.url);
      if (!defaultPlatform) return;

      const template = templates.find(
        (t) => t.id === settings.defaultRequestTemplateId && t.type === "request"
      ) ?? templates.find((t) => t.type === "request" && t.isDefault);
      if (!template) return;

      const toastId = genId();
      const cancelToken: CancelToken = { cancelled: false };
      cancelTokens.set(toastId, cancelToken);

      setPendingToasts((prev) => [
        ...prev,
        {
          id: toastId,
          customerName: customer.name,
          delayMinutes: settings.autoSendDelayMinutes,
          scheduledAt: new Date().toISOString(),
        },
      ]);

      setTimeout(
        async () => {
          if (cancelToken.cancelled) return;
          try {
            const res = await fetch("/api/bewertung/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: customer.phone,
                channel: settings.defaultChannel,
                templateBody: template.body,
                platformId: defaultPlatform.id,
                platformUrl: defaultPlatform.url,
                customerId: customer.customerId,
                customerName: customer.name,
                templateId: template.id,
                triggerType: "transaction",
                triggerId: customer.triggerId,
              }),
            });
            const data = (await res.json()) as { success: boolean; requestId?: string; token?: string };
            if (data.success && data.requestId && data.token) {
              addRequest({
                customerId: customer.customerId,
                customerName: customer.name,
                customerPhone: customer.phone,
                channel: settings.defaultChannel,
                templateId: template.id,
                sentAt: new Date().toISOString(),
                status: "sent",
                triggerType: "transaction",
                triggerId: customer.triggerId,
                platformId: defaultPlatform.id,
                trackingToken: data.token,
              });
            }
          } catch {
            // Silent fail — auto-send is best-effort
          }
          setPendingToasts((prev) => prev.filter((t) => t.id !== toastId));
          cancelTokens.delete(toastId);
        },
        settings.autoSendDelayMinutes * 60 * 1000
      );
    },
    [settings, templates, addRequest]
  );

  const cancelTrigger = useCallback((toastId: string) => {
    const token = cancelTokens.get(toastId);
    if (token) token.cancelled = true;
    cancelTokens.delete(toastId);
    setPendingToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  return { trigger, pendingToasts, cancelTrigger };
}
