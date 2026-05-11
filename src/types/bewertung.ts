export type PlatformType = "google" | "yelp" | "trustpilot" | "custom";
export type Channel = "whatsapp" | "sms";
export type TriggerType = "appointment" | "transaction" | "manual";
export type RequestStatus = "pending" | "sent" | "delivered" | "clicked" | "failed";
export type EntryStatus = "new" | "read" | "responded";
export type TemplateType = "request" | "response";
export type AutoSendTrigger = "appointment" | "transaction" | "both";
export type StarRating = 1 | 2 | 3 | 4 | 5;

export interface ReviewPlatform {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  type: PlatformType;
  isDefault?: boolean;
}

export interface ReviewRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  channel: Channel;
  templateId: string;
  sentAt: string;
  status: RequestStatus;
  triggerType: TriggerType;
  triggerId?: string;
  platformId: string;
  trackingToken: string;
  clickedAt?: string;
}

export interface ReviewEntry {
  id: string;
  platformId: string;
  platformReviewId?: string;
  customerName: string;
  rating: StarRating;
  text: string;
  publishedAt: string;
  isPublic: boolean;
  responseTemplateId?: string;
  respondedAt?: string;
  responseText?: string;
  status: EntryStatus;
}

export interface MessageTemplate {
  id: string;
  name: string;
  channel: Channel | "both";
  type: TemplateType;
  body: string;
  variables: string[];
  isDefault: boolean;
}

export interface ReviewSettings {
  platforms: ReviewPlatform[];
  autoSendEnabled: boolean;
  autoSendDelayMinutes: number;
  autoSendTrigger: AutoSendTrigger;
  defaultChannel: Channel;
  defaultRequestTemplateId: string;
  businessName: string;
  testPhone: string;
}
