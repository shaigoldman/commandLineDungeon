import { portrait } from "./art";
const positions: Record<string, string> = {
  Warrior: "0% 0%",
  Knight: "100% 0%",
  Scout: "0% 100%",
  Mage: "100% 100%",
  Over9000: "0% 0%",
  D: "0% 100%",
};
/** Original generated portrait sheet: four independent busts, no extracted game art. */
export function Portrait({
  type,
  className = "",
  alt,
}: {
  type: string;
  className?: string;
  alt?: string;
}) {
  const position = positions[type];
  return (
    <span
      role="img"
      aria-label={alt || type}
      className={"portrait-art " + className}
      style={
        position
          ? {
              backgroundImage: "url(/assets/portraits.png)",
              backgroundSize: "200% 200%",
              backgroundPosition: position,
            }
          : {
              backgroundImage: `url(${portrait(type)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
      }
    />
  );
}
