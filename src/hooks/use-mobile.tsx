import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Inicializamos com undefined para evitar erros de hidratação (SSR)
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // 🛡️ Usamos matchMedia diretamente, que é mais performático que window.innerWidth
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      // Atualiza o estado apenas quando o breakpoint é de fato cruzado
      setIsMobile(mql.matches);
    };

    // Ouvinte moderno para mudanças de tamanho de tela
    mql.addEventListener("change", onChange);
    
    // Define o valor inicial
    setIsMobile(mql.matches);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Retorna falso por padrão enquanto o estado é undefined (evita quebra de layout)
  return !!isMobile;
}