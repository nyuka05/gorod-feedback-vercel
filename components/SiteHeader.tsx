import Link from "next/link";

export function SiteHeader({ accepting = true, compact = false }: { accepting?: boolean; compact?: boolean }) {
  return (
    <header className={`site-header ${compact ? "compact" : ""}`}>
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="На главную">
          <span className="brand-mark">ГУ<span>2.0</span></span>
          <span className="brand-copy">Школа городских<br />продюсеров</span>
        </Link>
        <span className={`status-pill ${accepting ? "open" : "closed"}`}>
          <span className="status-dot" />{accepting ? "Приём открыт" : "Приём завершён"}
        </span>
      </div>
    </header>
  );
}
