import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      stored === "dark" ||
      (!stored &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    setIsDark(prefersDark);

    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newThemeIsDark = !isDark;
    setIsDark(newThemeIsDark);

    if (newThemeIsDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-full border border-white/10 bg-black/20 backdrop-blur-xl hover:bg-black/40 hover:shadow-[0_0_16px_rgba(255,255,255,0.15)] transition-all"
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-yellow-400" />
      ) : (
        <Moon className="w-4 h-4 text-slate-200" />
      )}
    </Button>
  );
};
