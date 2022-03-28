export interface ChangeThemePayload {
  kind: "light" | "dark";
  foreground?: string;
  background?: string;
}

export interface ThemeUpdate {
  command: "changeTheme";
  payload: ChangeThemePayload;
}

type ThemeRequests = ThemeUpdate;

export type { ThemeRequests };
