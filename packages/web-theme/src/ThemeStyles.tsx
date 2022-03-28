import { ThemeState } from "./index";

export default function ThemeStyles({ theme }: { theme: ThemeState }) {
  const vars = [];

  if (theme.foreground !== undefined) {
    vars.push(`--xliic-custom-foreground: ${theme.foreground};`);
  }

  if (theme.background !== undefined) {
    vars.push(`--xliic-custom-background: ${theme.background};`);
  }

  const style = `:root { ${vars.join("\n")} }
	 body {
	   background-color: var(--xliic-background);
	   color: var(--xliic-foreground);
	   }
	`;
  return <style>{style}</style>;
}
