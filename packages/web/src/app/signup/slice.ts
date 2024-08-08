import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  AnondCredentials,
  PlatformConnectionTestError,
  PlatformCredentials,
  AnondTokenResponseResult,
} from "@xliic/common/signup";

type FormID =
  | "BasicSignUpForm"
  | "PlatformSignUpForm"
  | "AnondSignUpEmailForm"
  | "AnondSignUpTokenForm";

export interface SignUpState {
  agreeToTermsAndConditions: boolean;
  showTermsAndConditionsError: boolean;
  anondCredentials: AnondCredentials;
  waitingForAnondToken: boolean;
  anondTokenRequestResult?: AnondTokenResponseResult;
  platformCredentials: PlatformCredentials;
  waitingForPlatformConnectionTest: boolean;
  platformConnectionTestResult?: PlatformConnectionTestError;
  currentFormId: FormID;
  // If IDE closes the view it has little sense, but if not we do not let a user to mess up
  complete: boolean; // If true, disable all UI components
}

const initialState: SignUpState = {
  agreeToTermsAndConditions: false,
  showTermsAndConditionsError: false,
  anondCredentials: { email: "", anondToken: "" },
  waitingForAnondToken: false,
  anondTokenRequestResult: undefined,
  platformCredentials: {
    platformUrl: "",
    platformApiToken: "",
  },
  waitingForPlatformConnectionTest: false,
  platformConnectionTestResult: undefined,
  currentFormId: "AnondSignUpEmailForm",
  complete: false,
};

export const slice = createSlice({
  name: "signup",
  initialState,
  reducers: {
    requestAnondTokenByEmail: (state, action: PayloadAction<string>) => {
      state.anondCredentials.email = action.payload;
      state.waitingForAnondToken = true;
      state.anondTokenRequestResult = undefined;
    },
    showAnondTokenResponse: (state, action: PayloadAction<AnondTokenResponseResult>) => {
      state.waitingForAnondToken = false;
      state.anondTokenRequestResult = action.payload;
      if (
        state.currentFormId === "AnondSignUpEmailForm" &&
        state.anondTokenRequestResult?.success
      ) {
        state.currentFormId = "AnondSignUpTokenForm";
      }
    },
    saveAnondEmail: (state, action: PayloadAction<string>) => {
      state.anondCredentials.email = action.payload;
      state.anondTokenRequestResult = undefined;
    },
    saveAnondToken: (state, action: PayloadAction<string>) => {
      state.anondCredentials.anondToken = action.payload;
    },
    resetAnondTokenRequestResult: (state, action: PayloadAction<undefined>) => {
      state.anondTokenRequestResult = undefined;
      if (state.currentFormId === "AnondSignUpTokenForm") {
        state.currentFormId = "AnondSignUpEmailForm";
      }
    },
    anondSignUpComplete: (state, action: PayloadAction<AnondCredentials>) => {
      state.complete = true;
      state.anondCredentials.anondToken = action.payload.anondToken;
    },
    savePlatformCredentials: (state, action: PayloadAction<PlatformCredentials>) => {
      state.platformCredentials.platformUrl = action.payload.platformUrl;
      state.platformCredentials.platformApiToken = action.payload.platformApiToken;
      state.platformConnectionTestResult = undefined;
    },
    showPlatformConnectionTestError: (
      state,
      action: PayloadAction<PlatformConnectionTestError>
    ) => {
      state.waitingForPlatformConnectionTest = false;
      state.platformConnectionTestResult = action.payload;
      state.complete = false;
    },
    platformSignUpComplete: (state, action: PayloadAction<PlatformCredentials>) => {
      state.platformCredentials.platformUrl = action.payload.platformUrl;
      state.platformCredentials.platformApiToken = action.payload.platformApiToken;
      state.waitingForPlatformConnectionTest = true;
      state.platformConnectionTestResult = undefined;
      state.complete = true;
    },
    saveAgreeToTermsAndConditions: (state, action: PayloadAction<boolean>) => {
      state.agreeToTermsAndConditions = action.payload;
      if (state.agreeToTermsAndConditions) {
        state.showTermsAndConditionsError = false;
      }
    },
    showTermsAndConditionsError: (state, action: PayloadAction<boolean>) => {
      state.showTermsAndConditionsError = action.payload;
    },
    openLink: (state, action: PayloadAction<string>) => {
      // hook for a listener
    },
    setCurrentFormId: (state, action: PayloadAction<FormID>) => {
      state.currentFormId = action.payload;
    },
  },
});

export const {
  requestAnondTokenByEmail,
  showAnondTokenResponse,
  saveAnondEmail,
  saveAnondToken,
  resetAnondTokenRequestResult,
  anondSignUpComplete,
  showPlatformConnectionTestError,
  savePlatformCredentials,
  platformSignUpComplete,
  saveAgreeToTermsAndConditions,
  showTermsAndConditionsError,
  openLink,
  setCurrentFormId,
} = slice.actions;

export default slice.reducer;
