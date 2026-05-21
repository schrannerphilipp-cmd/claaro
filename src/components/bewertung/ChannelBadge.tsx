import { Channel } from "@/types/bewertung";

interface ChannelBadgeProps {
  channel: Channel;
  showLabel?: boolean;
}

export default function ChannelBadge({ showLabel = false }: ChannelBadgeProps) {
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
