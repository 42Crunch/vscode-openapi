import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LoadScanconfMessage, SaveScanconfMessage } from "@xliic/common/playbook";
import { BundledSwaggerOrOasSpec } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import * as scan from "../../../core/playbook/scanconfig";
import { GeneralError } from "@xliic/common/error";
import { parse } from "../../../core/playbook/scanconf-parser";

export type State = {
  oas: BundledSwaggerOrOasSpec;
  playbook: playbook.PlaybookBundle;
  scanconf?: scan.ConfigurationFileBundle;
  gerror?: GeneralError;
  dirty: boolean;
};

const initialState: State = {
  oas: {
    openapi: "3.0.0",
    info: { title: "", version: "0.0" },
    paths: { "/": { get: { responses: {} } } },
  },
  playbook: {
    operations: {},
    authenticationDetails: [{}],
    before: [],
    after: [],
    environments: {},
  },
  dirty: false,
};

export const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loadScanconf: (
      state,
      { payload: { scanconf, oas } }: PayloadAction<LoadScanconfMessage["payload"]>
    ) => {
      state.oas = oas;
      state.scanconf = JSON.parse(scanconf);
      const [playbook, error] = parse(oas, state.scanconf!);
      if (error !== undefined) {
        const message = error.map((e) => `${e.message}: ${e.pointer}`).join(" ");
        state.gerror = { message };
        return;
      }
      state.playbook = playbook;
    },
    updateScanconf: (state, { payload: scanconf }: PayloadAction<string>) => {
      // this will cause local edits to be lost
      state.scanconf = JSON.parse(scanconf);
      state.dirty = false;
      const [playbook, error] = parse(state.oas, state.scanconf!);
      if (error !== undefined) {
        const message = error.map((e) => `${e.message}: ${e.pointer}`).join(" ");
        state.gerror = { message };
        return;
      }
      state.playbook = playbook;
    },
    saveScanconf: (state) => {
      state.dirty = false;
    },
    saveCredential: (
      state,
      {
        payload: { group, id, credential },
      }: PayloadAction<{ group: number; id: string; credential: playbook.Credential }>
    ) => {
      state.playbook.authenticationDetails[group][id] = credential;
      state.dirty = true;
    },
    addCredential: (
      state,
      {
        payload: { id, credential },
      }: PayloadAction<{ id: string; credential: playbook.Credential }>
    ) => {
      state.playbook.authenticationDetails[0][id] = credential;
      state.dirty = true;
    },
  },
});

export const { loadScanconf, saveScanconf, addCredential, saveCredential, updateScanconf } =
  slice.actions;

export default slice.reducer;
