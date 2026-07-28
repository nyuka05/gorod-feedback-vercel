import Link from "next/link";
import Image from "next/image";

export function SiteHeader({ accepting = true, compact = false }: { accepting?: boolean; compact?: boolean }) {
  return (
    <header className={`site-header ${compact ? "compact" : ""}`}>
      <div className="shell header-inner">
        <Link className="brand" href="/" aria-label="На главную">
          <Image className="brand-logo" src="/city-university-logo.png" width={245} height={100} alt="Городской университет 2.0" priority />
        </Link>
        <span className={`status-pill ${accepting ? "open" : "closed"}`}>
          <span className="status-dot" />{accepting ? "Приём открыт" : "Приём завершён"}
        </span>
      </div>
    </header>
  );
}
