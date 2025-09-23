import "./Boo.css";

interface BooProps {
  color: number | undefined;
  size: number;
}

export function Boo({ color, size }: BooProps) {
  return (
    <svg
      className="boo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      height={`${size}px`}
      width={`${size}px`}
    >
      <path d="M 20 0 H 40 V 4 H 48 V 8 H 52 V 12 H 56 V 20 H 60 V 32 H 64 V 44 H 60 V 48 H 56 V 52 H 48 V 56 H 40 V 60 H 24 V 56 H 12 V 52 H 8 V 48 H 4 V 40 H 0 V 20 H 4 V 12 H 8 V 8 H 12 V 4 H 20" />
      <path
        d="M 20 4 H 40 V 8 H 48 V 12 H 52 V 20 H 56 V 32 H 60 V 44 H 56 V 48 H 48 V 52 H 40 V 56 H 24 V 52 H 12 V 48 H 8 V 40 H 4 V 20 H 8 V 12 H 12 V 8 H 20 V 4"
        fill={toBooColor(color)}
      />
      <path d="M12 16 H 16 V 24 H 12 V 16" />
      <path d="M20 16 H 24 V 24 H 20 V 16" />
      <path d="M36 24 H 40 V 20 H 48 V 24 H 52 V 32 H 48 V 36 H 44 V 32 H 48 V 24 H 40 V 28 H 36 V 24" />
      <path
        d="M 8 28 H 12 V 32 H 16 V 28 H 20 V 32 H 24 V 28 H 28 V 40 H 32 V 48 H 28 V 44 H 24 V 48 H 20 V 44 H 16 V 48 H 12 V 40 H 8 V 28"
        fill="#000a"
      />
    </svg>
  );
}

export function toBooColor(offset: number | undefined) {
  return `oklch(0.7 0.1 ${offset ?? 0})`;
}

export function toBooSecondaryColor(offset: number | undefined) {
  return `oklch(0.9 0.05 ${offset ?? 0})`;
}
