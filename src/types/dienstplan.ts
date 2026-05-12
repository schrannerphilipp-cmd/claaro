export type Rolle = "admin" | "mitarbeiter";
export type Land = "DE" | "AT" | "CH";
export type VertragTyp = "vollzeit" | "teilzeit" | "minijob";
export type ShiftStatus = "entwurf" | "bestaetigt" | "getauscht";
export type PlanStatus = "entwurf" | "veroeffentlicht";
export type VacationStatus = "beantragt" | "genehmigt" | "abgelehnt";
export type SwapStatus = "offen" | "angenommen" | "abgelehnt";
export type NotifTyp = "schicht" | "urlaub" | "tausch" | "erinnerung";
export type WhatsappStatus = "gesendet" | "fehler";

export interface Employee {
  id: string;
  hauptaccount_id: string;
  auth_user_id: string | null;
  name: string;
  email: string;
  telefon: string;
  rolle: Rolle;
  land: Land;
  stunden_pro_woche: number;
  vertrag_typ: VertragTyp;
  aktiv: boolean;
  urlaub_tage_jahr: number;
  created_at: string;
}

export interface Availability {
  id: string;
  employee_id: string;
  woche: string;
  tag: number; // 0=Mo … 6=So
  von: string | null;
  bis: string | null;
  verfuegbar: boolean;
  notiz: string | null;
  created_at: string;
}

export interface ShiftPlan {
  id: string;
  hauptaccount_id: string;
  woche: string;
  status: PlanStatus;
  ki_begruendung: string | null;
  erstellt_at: string;
  veroeffentlicht_at: string | null;
}

export interface Shift {
  id: string;
  employee_id: string;
  shift_plan_id: string | null;
  hauptaccount_id: string;
  datum: string;
  von: string;
  bis: string;
  pause_minuten: number;
  rolle_im_dienst: string;
  status: ShiftStatus;
  erstellt_von_ki: boolean;
  created_at: string;
}

export interface Vacation {
  id: string;
  employee_id: string;
  von: string;
  bis: string;
  status: VacationStatus;
  notiz: string | null;
  ablehngrund: string | null;
  created_at: string;
}

export interface ShiftSwap {
  id: string;
  shift_id_original: string;
  shift_id_angebot: string | null;
  employee_id_anfrage: string;
  employee_id_angebot: string | null;
  status: SwapStatus;
  admin_genehmigt: boolean | null;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  employee_id: string;
  typ: NotifTyp;
  whatsapp_status: WhatsappStatus;
  nachricht: string;
  fehler_detail: string | null;
  sent_at: string;
}

// API response types
export interface KiErstellenResponse {
  success: boolean;
  plan?: ShiftPlan;
  schichten?: Shift[];
  begruendung?: string;
  warnungen?: string[];
  error?: string;
}
