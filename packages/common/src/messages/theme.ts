import { ThemeColorValues } from "../theme";

export interface ChangeThemePayload extends ThemeColorValues {
  kind: "light" | "dark";
}

export interface ThemeUpdate {
  command: "changeTheme";
  payload: ChangeThemePayload;
}

type ThemeRequests = ThemeUpdate;

export type { ThemeRequests };
