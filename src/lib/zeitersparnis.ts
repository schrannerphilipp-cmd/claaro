// Globaler Zeitersparnis-Event-Bus
// Aufruf aus beliebigen Client-Komponenten: triggerZeitersparnisToast("Angebot erstellt", 45)

export interface ZeitersparnisEvent {
  aktion: string;
  minuten: number;
}

export function triggerZeitersparnisToast(aktion: string, minuten: number): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ZeitersparnisEvent>("claaro:zeitersparnis", {
      detail: { aktion, minuten },
    })
  );
}
