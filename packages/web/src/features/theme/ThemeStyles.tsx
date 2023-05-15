import { ThemeColorVariables, ThemeColorValues, ThemeColorNames } from "@xliic/common/theme";
import { useFeatureSelector } from "./slice";

export default function ThemeStyles() {
  const theme = useFeatureSelector((state) => state.theme);

  return (
    <style>
      {customProps(theme.theme)}
      {defaultStyles()}
    </style>
  );
}

function defaultStyles(): string {
  return `
  body {
    padding: 0;
    margin: 0;
    background-color: var(--xliic-background);
    color: var(--xliic-foreground);
    }`;
}

function customProps(theme?: ThemeColorValues): string {
  const vars: string[] = [];

  if (theme !== undefined) {
    for (const name of ThemeColorNames) {
      if (theme[name]) {
        vars.push(`${ThemeColorVariables[name]}: ${theme[name]};`);
      }
    }
  }

  return `:root {
    ${vars.join("\n")}
  }`;
}
