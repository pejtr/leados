import { SUPPORTED_LANGUAGES } from "@/i18n";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface LanguageSwitcherProps {
  variant?: "pills" | "flags";
  className?: string;
}

export function LanguageSwitcher({ variant = "pills", className }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = i18n.language?.slice(0, 2) || "en";

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  if (variant === "flags") {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {SUPPORTED_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            title={lang.fullLabel}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
              current === lang.code
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-0.5 bg-secondary/50 rounded-lg p-0.5", className)}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          title={lang.fullLabel}
          className={cn(
            "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
            current === lang.code
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
