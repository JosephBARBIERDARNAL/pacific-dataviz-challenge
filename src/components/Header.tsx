import type { View } from "../types";

interface HeaderProps {
  onSelect: (view: View) => void;
}

export function Header({ onSelect }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a
          className="wordmark"
          href="?view=global"
          onClick={(event) => {
            event.preventDefault();
            onSelect("global");
          }}
        >
          Pacific sea level
        </a>
        <p className="header-note">1947–2025 · 21 places · two records</p>
      </div>
    </header>
  );
}
