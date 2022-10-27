export interface GeneralError {
  message: string;
}

export type ShowGeneralErrorMessage = { command: "showGeneralError"; payload: GeneralError };
