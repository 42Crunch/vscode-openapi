import { ThemeState } from "./index";
import { ThemeColorVariables, ThemeColorValues, ThemeColorNames } from "@xliic/common/theme";

export default function ThemeStyles({ theme }: { theme: ThemeState }) {
  return (
    <style>
      {customProps(theme.theme)}
      {defaultStyles()}
      {bootstrapColorOverrides()}
    </style>
  );
}

function defaultStyles(): string {
  return `
  body {
    padding: 0;
    margin: 0 4px;
    background-color: var(--xliic-background);
    color: var(--xliic-foreground);
    }`;
}

function customProps(theme?: ThemeColorValues): string {
  const vars: string[] = [];

  if (theme !== undefined) {
    for (const name of ThemeColorNames) {
      vars.push(`${ThemeColorVariables[name]}-custom: ${theme[name]};`);
    }
  }

  return `:root {
    ${vars.join("\n")}
  }`;
}

function bootstrapColorOverrides(): string {
  return `#root .btn-primary {
    --bs-btn-color: var(${ThemeColorVariables.buttonForeground});
    --bs-btn-bg: var(${ThemeColorVariables.buttonBackground});
    --bs-btn-border-color: var(${ThemeColorVariables.buttonBorder});
    --bs-btn-hover-color: var(${ThemeColorVariables.buttonForeground});
    --bs-btn-hover-bg: var(${ThemeColorVariables.buttonHoverBackground});
    --bs-btn-hover-border-color: var(${ThemeColorVariables.buttonHoverBackground});
    --bs-btn-disabled-color: var(${ThemeColorVariables.disabledForeground});
    --bs-btn-disabled-bg: var(${ThemeColorVariables.buttonBackground});
    --bs-btn-disabled-border-color: var(${ThemeColorVariables.buttonBorder});
  }

  #root .btn-secondary {
    --bs-btn-color: var(${ThemeColorVariables.buttonSecondaryForeground});
    --bs-btn-bg: var(${ThemeColorVariables.buttonSecondaryBackground});
    --bs-btn-border-color: var(${ThemeColorVariables.buttonBorder});
    --bs-btn-hover-color: var(${ThemeColorVariables.buttonSecondaryForeground});
    --bs-btn-hover-bg: var(${ThemeColorVariables.buttonSecondaryHoverBackground});
    --bs-btn-hover-border-color: var(${ThemeColorVariables.buttonSecondaryHoverBackground});
    --bs-btn-disabled-color: var(${ThemeColorVariables.buttonSecondaryForeground});
    --bs-btn-disabled-bg: var(${ThemeColorVariables.buttonSecondaryBackground});
    --bs-btn-disabled-border-color: var(${ThemeColorVariables.buttonBorder});
  }

  #root .dropdown-menu {
    --bs-dropdown-border-color: var(${ThemeColorVariables.dropdownBorder});
    --bs-dropdown-bg: var(${ThemeColorVariables.dropdownBackground});
    --bs-dropdown-link-color: var(${ThemeColorVariables.dropdownForeground});
  }

  #root .form-control, #root .form-select {
    color: var(${ThemeColorVariables.inputForeground});
    background-color: var(${ThemeColorVariables.inputBackground});
    border: 1px solid var(${ThemeColorVariables.border});
  }

  #root .form-control:focus, #root .form-select:focus {
    box-shadow: 0 0 0 0.25rem var(${ThemeColorVariables.focusBorder});
  }

  #root .invalid-feedback {
    color: var(${ThemeColorVariables.errorForeground});
  }

  #root :focus-visible {
    outline-color: var(${ThemeColorVariables.focusBorder});
    outline-width: medium;
    outline-style: solid;
  }
  `;
}
