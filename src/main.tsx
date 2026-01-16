import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "sonner";

// Renderização Principal
createRoot(document.getElementById("root")!).render(<App />);

/**
 * 🦈 Registro da Creditrack Engine (PWA)
 * Garante performance offline e atualizações inteligentes
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Verifica se há uma nova versão aguardando (Heurística #1)
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // Nova versão detectada - Notifica o Shark
                  toast.info("Nova versão da Creditrack Engine disponível!", {
                    description: "Clique em atualizar para otimizar sua banca.",
                    action: {
                      label: "Atualizar",
                      onClick: () => window.location.reload(),
                    },
                    duration: Infinity, // Fica visível até o usuário decidir
                  });
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.error("❌ Erro ao ativar a Engine Creditrack:", error);
      });
  });
}