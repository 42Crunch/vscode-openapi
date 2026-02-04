import { CSSProperties } from "react";
import { AngleUp, AngleDown } from "../../../icons";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function CollapsibleCaret({
  isOpen,
  style,
  onClick,
}: {
  isOpen: boolean;
  style?: CSSProperties;
  onClick?: (event: React.MouseEvent<SVGElement>) => void;
}) {
  if (isOpen) {
    return (
      <AngleUp
        onClick={onClick}
        style={{
          cursor: "pointer",
          fill: `var(${ThemeColorVariables.foreground})`,
          ...style,
        }}
      />
    );
  }
  return (
    <AngleDown
      onClick={onClick}
      style={{
        cursor: "pointer",
        fill: `var(${ThemeColorVariables.foreground})`,
        ...style,
      }}
    />
  );
}
