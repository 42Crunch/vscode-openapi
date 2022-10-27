import { AngleUp, AngleDown } from "../../icons";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function CollapsibleCaret({ isOpen }: { isOpen: boolean }) {
  if (isOpen) {
    return (
      <AngleUp
        style={{
          width: 24,
          height: 24,
          marginRight: 8,
          fill: `var(${ThemeColorVariables.foreground})`,
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
        fill: `var(${ThemeColorVariables.foreground})`,
      }}
    />
  );
}
