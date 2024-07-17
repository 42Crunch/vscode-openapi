import { createSlice, PayloadAction, Dispatch, StateFromReducersMapObject } from "@reduxjs/toolkit";
import {
  AnondCredentials,
  PlatformConnectionTestError,
  PlatformCredentials,
  AnondTokenResponseResult,
} from "@xliic/common/signup";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

export interface SignUpState {
  agreeToTermsAndConditions: boolean;
  anondCredentials: AnondCredentials;
  waitingForAnondToken: boolean;
  anondTokenRequestResult?: AnondTokenResponseResult;
  platformCredentials: PlatformCredentials;
  waitingForPlatformConnectionTest: boolean;
  platformConnectionTestResult?: PlatformConnectionTestError;
  // If IDE closes the view it has little sense, but if not we do not let a user to mess up
  complete: boolean; // If true, disable all UI components
}

const initialState: SignUpState = {
  agreeToTermsAndConditions: false,
  anondCredentials: { email: "", anondToken: "" },
  waitingForAnondToken: false,
  anondTokenRequestResult: undefined,
  platformCredentials: {
    platformUrl: "https://42crunch.com/websales-customer-agreement",
    platformApiToken: "",
  },
  waitingForPlatformConnectionTest: false,
  platformConnectionTestResult: undefined,
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
    },
    openLink: (state, action: PayloadAction<string>) => {
      // hook for a listener
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
  openLink,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
