interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Extend the global WindowEventMap to include the new event type
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// components/LinkifiedText.tsx
type LinkifiedTextProps = { label: string; children: JSX.Element };

// pages/index.tsx
type ClientData = Data<File>;

type Data<F> = { title: string; text: string; url: string; files: F[]; noFiles: boolean };

type Message = { data: ClientData };

type ServiceWorkerData = Data<FormDataEntryValue>;
