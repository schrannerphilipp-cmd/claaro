import { Channel } from "@/types/bewertung";

interface ChannelBadgeProps {
  channel: Channel;
  showLabel?: boolean;
}

export default function ChannelBadge({ channel, showLabel = false }: ChannelBadgeProps) {
  if (channel === "whatsapp") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
        style={{ borderColor: "rgba(37,211,102,0.3)", color: "#25d366", backgroundColor: "rgba(37,211,102,0.1)" }}>
        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0a8 8 0 00-6.9 12L0 16l4.1-1.1A8 8 0 108 0zm0 14.5a6.5 6.5 0 01-3.3-.9l-.2-.1-2.4.6.7-2.3-.2-.2A6.5 6.5 0 118 14.5zm3.5-4.8c-.2-.1-1.1-.5-1.3-.6-.2-.1-.3-.1-.4.1l-.6.7c-.1.1-.2.1-.4 0a5 5 0 01-1.4-.9 5.4 5.4 0 01-1-1.4c-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2.1-.3s-.4-.9-.5-1.2c-.1-.3-.3-.3-.4-.3h-.4a.8.8 0 00-.6.3 2.5 2.5 0 00-.8 1.9 4.3 4.3 0 001 2.3 10 10 0 003.8 3.3c1.6.6 1.6.4 1.9.4a2.3 2.3 0 001.5-.8 1.8 1.8 0 00.1-1c-.1-.1-.2-.2-.4-.3z"/>
        </svg>
        {showLabel && "WhatsApp"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
      style={{ borderColor: "rgba(59,130,246,0.3)", color: "#3b82f6", backgroundColor: "rgba(59,130,246,0.1)" }}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
        <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M2 6l6 4 6-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      {showLabel && "SMS"}
    </span>
  );
}
