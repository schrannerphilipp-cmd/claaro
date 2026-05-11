"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageTemplate } from "@/types/bewertung";

const KEY = "claaro_message_templates";

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const STARTER_TEMPLATES: MessageTemplate[] = [
  {
    id: "tpl-sms-default",
    name: "SMS-Anfrage (Standard)",
    channel: "sms",
    type: "request",
    body: "Hallo {kunde}, vielen Dank für Ihren Auftrag bei {betrieb}! Wir würden uns über eine kurze Bewertung freuen: {link} 🙏",
    variables: ["{kunde}", "{betrieb}", "{link}"],
    isDefault: true,
  },
  {
    id: "tpl-wa-default",
    name: "WhatsApp-Anfrage (Standard)",
    channel: "whatsapp",
    type: "request",
    body: "Hallo {kunde} 👋 Danke für Ihr Vertrauen in {betrieb}! Falls Sie einen Moment Zeit haben — wir freuen uns über Ihr Feedback: {link}",
    variables: ["{kunde}", "{betrieb}", "{link}"],
    isDefault: true,
  },
  {
    id: "tpl-response-5",
    name: "Antwort-Vorlage (5 Sterne)",
    channel: "both",
    type: "response",
    body: "Vielen herzlichen Dank für Ihre tolle Bewertung, {kunde}! Es war uns eine Freude, für Sie tätig zu sein.",
    variables: ["{kunde}", "{betrieb}"],
    isDefault: false,
  },
  {
    id: "tpl-response-kritisch",
    name: "Antwort-Vorlage (kritisch)",
    channel: "both",
    type: "response",
    body: "Liebe/r {kunde}, vielen Dank für Ihr offenes Feedback. Wir nehmen Ihre Anmerkungen ernst und melden uns persönlich bei Ihnen. Ihr Team {betrieb}",
    variables: ["{kunde}", "{betrieb}"],
    isDefault: false,
  },
];

export function useMessageTemplates() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        setTemplates(JSON.parse(raw) as MessageTemplate[]);
      } else {
        setTemplates(STARTER_TEMPLATES);
      }
    } catch {
      setTemplates(STARTER_TEMPLATES);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(KEY, JSON.stringify(templates));
  }, [templates, isLoaded]);

  const createTemplate = useCallback(
    (data: Omit<MessageTemplate, "id">): MessageTemplate => {
      const t: MessageTemplate = { id: genId(), ...data };
      setTemplates((prev) => [...prev, t]);
      return t;
    },
    []
  );

  const updateTemplate = useCallback(
    (id: string, patch: Partial<Omit<MessageTemplate, "id">>) => {
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
    },
    []
  );

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id || t.isDefault));
  }, []);

  return { templates, isLoaded, createTemplate, updateTemplate, deleteTemplate };
}
