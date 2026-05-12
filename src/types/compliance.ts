export type Branche = "gastronomie" | "handwerk" | "gesundheitswesen";
export type Wiederholung = "täglich" | "monatlich" | "jährlich" | "einmalig";
export type ComplianceStatus = "offen" | "erledigt" | "überfällig";
export type Priorität = "hoch" | "mittel" | "niedrig";

export interface ComplianceTask {
  id: string;
  titel: string;
  beschreibung: string;
  kategorie: string;
  branche: Branche;
  frist: string;
  wiederholung: Wiederholung;
  status: ComplianceStatus;
  priorität: Priorität;
  erinnerungTage: number;
  dokumente: string[];
}
