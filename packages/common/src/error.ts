export interface GeneralError {
  message: string;
  code?: string;
  details?: string;
}

export type ShowGeneralErrorMessage = { command: "showGeneralError"; payload: GeneralError };
