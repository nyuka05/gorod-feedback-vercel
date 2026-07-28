import Image from "next/image";

const palettes = ["coral", "violet", "gold", "sage", "sky"];

export function Avatar({ name, src, size = "medium", seed = 0 }: { name: string; src?: string | null; size?: "small" | "medium" | "large"; seed?: number }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return (
    <div className={`avatar ${size} ${palettes[seed % palettes.length]}`}>
      {src ? <Image src={src} alt={`Фотография: ${name}`} width={180} height={180} unoptimized /> : <span aria-hidden>{initials}</span>}
    </div>
  );
}
