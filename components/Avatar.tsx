const palettes = ["coral", "violet", "gold", "sage", "sky"];

export function Avatar({ name, size = "medium", seed = 0 }: { name: string; size?: "small" | "medium" | "large"; seed?: number }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <div className={`avatar ${size} ${palettes[seed % palettes.length]}`}><span aria-hidden>{initials}</span></div>;
}
