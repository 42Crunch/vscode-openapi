import { AngleUp, AngleDown } from "@xliic/web-icons";

export default function CollapsibleCaret({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <AngleUp
        style={{
          width: 24,
          height: 24,
          marginRight: 8,
          fill: "var(--xliic-foreground)",
        }}
      />
    );
  }
  return (
    <AngleDown
      style={{
        width: 24,
        height: 24,
        marginRight: 8,
        fill: "var(--xliic-foreground)",
      }}
    />
  );
}
