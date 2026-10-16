export function isInstalledMode(standalone: boolean, iosStandalone?: boolean): boolean {
  return standalone || iosStandalone === true;
}

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};