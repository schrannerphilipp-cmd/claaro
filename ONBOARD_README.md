# Claaro Onboard — Komponentenübersicht

## Ziel
Strukturierte Einarbeitungspläne in unter 30 Minuten erstellen, wiederverwendbar für jeden neuen Mitarbeiter.

## Datenpersistenz
Alle Daten liegen in `localStorage` (kein Backend erforderlich). Die beiden Hooks können 1:1 durch API-Calls (Supabase, REST) ersetzt werden — die UI berührt man dabei nicht.

---

## Typen (`src/types/onboard.ts`)

| Interface | Beschreibung |
|---|---|
| `OnboardTemplate` | Einarbeitungs-Template mit Metadaten und Schritt-Array |
| `OnboardStep` | Einzelner Schritt (Typ + Inhalt + Pflicht-Flag + Dauer) |
| `ChecklistContent` | Items mit label & required-Flag |
| `VideoContent` | URL (YouTube/Vimeo), Titel, Beschreibung, Dauer |
| `QuizContent` | Fragen mit Optionen, richtiger Antwort & Erklärung |
| `DocumentContent` | Freitext oder Datei-URL |
| `OnboardAssignment` | Zuweisung: Template → Mitarbeiter + Fortschritt |
| `StepProgress` | Welcher Schritt wann abgeschlossen, Quiz-Score |

---

## Hooks (`src/hooks/`)

### `useOnboardTemplates`
```typescript
const { templates, isLoaded, createTemplate, updateTemplate, deleteTemplate, getTemplate } = useOnboardTemplates();
```
- Liest/schreibt `localStorage["claaro_onboard_templates"]`
- `estimatedMinutes` wird aus den Step-Dauern automatisch berechnet

### `useOnboardAssignments`
```typescript
const { assignments, isLoaded, createAssignment, updateProgress, completeAssignment, deleteAssignment, getAssignment } = useOnboardAssignments();
```
- Liest/schreibt `localStorage["claaro_onboard_assignments"]`

---

## Komponenten (`src/components/onboard/`)

| Komponente | Beschreibung |
|---|---|
| `TemplateCard` | Vorschaukarte mit Typ-Icons, Status-Badge, Aktionen |
| `StepTypeSelector` | 2×2 Icon-Grid zur Typ-Auswahl |
| `ChecklistEditor` | Items hinzufügen/entfernen, Pflicht-Toggle |
| `VideoEmbedEditor` | URL-Input + iFrame-Vorschau (YouTube/Vimeo) |
| `QuizEditor` | Fragen + Antwortoptionen + richtige Antwort markieren |
| `DocumentEditor` | Freitext-Textarea + optionale Datei-URL |
| `StepBuilder` | Haupt-Builder: Sidebar (Drag & Drop) + Editor-Panel |
| `ProgressTracker` | SVG-Kreis + Step-Timeline |
| `QuizRunner` | Interaktives Quiz mit Sofort-Feedback + Auswertung |

---

## Seiten (`src/app/dashboard/onboarding/`)

| Route | Beschreibung |
|---|---|
| `/dashboard/onboarding` | Übersicht: Stats, letzte Einarbeitungen, Quick-Links |
| `/dashboard/onboarding/templates` | Template-Bibliothek mit Suche |
| `/dashboard/onboarding/templates/new` | Erstellt Template & leitet weiter |
| `/dashboard/onboarding/templates/[id]` | Builder: Inline-Edit, Auto-Save, Publish-Toggle |
| `/dashboard/onboarding/assignments` | Tabelle aller Zuweisungen + Neue-Einarbeitung-Formular |
| `/dashboard/onboarding/run/[id]` | Mitarbeiter-Ansicht: Step-Navigation, Konfetti-Abschluss |

---

## API-Migration (später)
1. Hooks durch API-Layer ersetzen (`fetch`, Supabase SDK, etc.)
2. `isLoaded` bleibt, wird zum Loading-State des API-Calls
3. Keine Änderungen an Komponenten oder Seiten notwendig
