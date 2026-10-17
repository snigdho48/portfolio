import { useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Command } from "cmdk";
import { useTheme } from "@/context/ThemeContext";
import { navSections, projects, siteConfig } from "@/data/portfolio";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function CommandPaletteModal({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleTheme, theme } = useTheme();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  useEffect(() => {
    onOpenChange(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const goSection = (id: string) => {
    onOpenChange(false);
    if (location.pathname !== "/") {
      navigate(`/#${id}`);
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.email);
    } catch {
      window.location.href = `mailto:${siteConfig.email}`;
    }
    onOpenChange(false);
  };

  const items = useMemo(
    () => ({
      sections: navSections,
      projects,
    }),
    [],
  );

  if (!open) return null;

  return (
    <div className="cmdk-root">
      <button
        type="button"
        className="cmdk-backdrop"
        aria-label="Close command palette"
        onClick={() => onOpenChange(false)}
      />
      <Command className="cmdk" label="Command palette" shouldFilter>
        <Command.Input placeholder="Jump, open, copy…" autoFocus />
        <Command.List>
          <Command.Empty>No results.</Command.Empty>

          <Command.Group heading="Navigate">
            {items.sections.map((s) => (
              <Command.Item
                key={s.id}
                value={`section ${s.label}`}
                onSelect={() => goSection(s.id)}
              >
                Go to {s.label}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Case studies">
            {items.projects.map((p) => (
              <Command.Item
                key={p.slug}
                value={`project ${p.title}`}
                onSelect={() => {
                  onOpenChange(false);
                  navigate(`/work/${p.slug}`);
                }}
              >
                Open {p.title}
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Actions">
            <Command.Item
              value="download cv"
              onSelect={() => {
                onOpenChange(false);
                window.open(siteConfig.cvPath, "_blank");
              }}
            >
              Download CV
            </Command.Item>
            <Command.Item value="copy email" onSelect={copyEmail}>
              Copy email
            </Command.Item>
            <Command.Item
              value="github"
              onSelect={() => {
                onOpenChange(false);
                window.open(siteConfig.github, "_blank", "noopener,noreferrer");
              }}
            >
              Open GitHub
            </Command.Item>
            <Command.Item
              value="linkedin"
              onSelect={() => {
                onOpenChange(false);
                window.open(
                  siteConfig.linkedin,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
              Open LinkedIn
            </Command.Item>
            <Command.Item
              value="toggle theme"
              onSelect={() => {
                toggleTheme();
                onOpenChange(false);
              }}
            >
              Switch to {theme === "dark" ? "light" : "dark"} theme
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
