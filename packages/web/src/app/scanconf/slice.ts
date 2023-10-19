import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GeneralError } from "@xliic/common/error";
import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { LoadScanconfMessage } from "@xliic/common/playbook";
import { Result } from "@xliic/common/result";
import { parse } from "../../core/playbook/scanconf-parser";
import * as scan from "../../core/playbook/scanconfig";
import { showScanconfOperation } from "./actions";

export type State = {
  oas: BundledSwaggerOrOasSpec;
  playbook: playbook.PlaybookBundle;
  scanconf?: scan.ConfigurationFileBundle;
  gerror?: GeneralError;
  dirty: boolean;
  servers: string[];

  selectedCredentialGroup: number;
  selectedCredential?: string;
  selectedSubcredential?: string;
};

const initialState: State = {
  oas: {
    openapi: "3.0.0",
    info: { title: "", version: "0.0" },
    paths: { "/": { get: { responses: {} } } },
  },
  playbook: {
    operations: {},
    requests: {},
    authenticationDetails: [{}],
    before: [],
    after: [],
    environments: {},
  },
  dirty: false,
  servers: [],

  selectedCredentialGroup: 0,
};

export const slice = createSlice({
  name: "scanconf",
  initialState,
  reducers: {
    loadScanconf: (
      state,
      { payload: { scanconf, oas } }: PayloadAction<LoadScanconfMessage["payload"]>
    ) => {
      const [parsed, parseError] = jsonParse(scanconf);
      if (parseError !== undefined) {
        state.gerror = { message: `Failed to parse scan configuration: ${parseError}` };
        return;
      }

      const [playbook, error] = parse(oas, parsed);
      if (error !== undefined) {
        const message = error.map((e) => `${e.message}: ${e.pointer}`).join(" ");
        state.gerror = { message };
        return;
      }

      state.oas = oas;
      state.scanconf = parsed;
      state.playbook = playbook;
    },

    updateScanconf: (state, { payload: scanconf }: PayloadAction<string>) => {
      // this will cause local edits to be lost
      const [parsed, parseError] = jsonParse(scanconf);
      if (parseError !== undefined) {
        state.gerror = { message: `Failed to parse scan configuration: ${parseError}` };
        return;
      }
      const [playbook, error] = parse(state.oas, parsed);
      if (error !== undefined) {
        const message = error.map((e) => `${e.message}: ${e.pointer}`).join(" ");
        state.gerror = { message };
        return;
      }
      state.dirty = false;
      state.scanconf = parsed;
      state.playbook = playbook;
    },

    saveScanconf: (state) => {
      state.dirty = false;
    },

    saveSettings: (state, { payload: settings }: PayloadAction<playbook.RuntimeConfiguration>) => {
      state.playbook.runtimeConfiguration = settings;
    },
    saveRequest: (
      state,
      {
        payload: { ref, stage },
      }: PayloadAction<{
        ref: playbook.RequestRef;
        stage: playbook.StageContent | playbook.ExternalStageContent;
      }>
    ) => {
      if (ref.type === "operation") {
        state.playbook.operations[ref.id].request = stage as playbook.StageContent;
      } else if (state.playbook.requests) {
        state.playbook.requests[ref.id] = stage;
      }
    },
    removeRequest: (state, { payload: ref }: PayloadAction<playbook.RequestRef>) => {
      // only 'request' requests can be deleted
      if (ref.type === "request") {
        if (state.playbook.requests?.[ref.id] !== undefined) {
          delete state.playbook.requests[ref.id];
        }
      }
    },
    saveCredential: (
      state,
      {
        payload: { group, id, credential },
      }: PayloadAction<{ group: number; id: string; credential: playbook.Credential }>
    ) => {
      state.playbook.authenticationDetails[group][id] = credential;
      if (
        state.selectedSubcredential !== undefined &&
        credential?.methods?.[state.selectedSubcredential] === undefined
      ) {
        // subcredential was deleted, select first available one
        state.selectedSubcredential = Object.keys(credential?.methods || {})[0];
      }
      state.dirty = true;
    },
    saveEnvironment: (
      state,
      {
        payload: { name, environment },
      }: PayloadAction<{ name: string; environment: playbook.PlaybookEnvironment }>
    ) => {
      state.playbook.environments[name] = environment;
      state.dirty = true;
    },

    addCredential: (
      state,
      {
        payload: { credentialGroup, id, credential },
      }: PayloadAction<{ credentialGroup: number; id: string; credential: playbook.Credential }>
    ) => {
      state.playbook.authenticationDetails[credentialGroup][id] = credential;
      state.dirty = true;
    },

    selectCredential: (
      state,
      { payload }: PayloadAction<{ group: number; credential: string }>
    ) => {
      state.selectedCredentialGroup = payload.group;
      state.selectedCredential = payload.credential;
      state.selectedSubcredential = Object.keys(
        state.playbook.authenticationDetails?.[payload.group]?.[payload.credential]?.methods || {}
      )[0];
    },

    selectSubcredential: (state, { payload }: PayloadAction<string>) => {
      state.selectedSubcredential = payload;
    },

    saveOperationReference: (
      state,
      {
        payload: { location, reference },
      }: PayloadAction<{
        location: playbook.StageLocation;
        reference: playbook.StageReference;
      }>
    ) => {
      getStageContainer(state.playbook, location)[location.stageIndex] = reference;
    },
    addStage: (
      state,
      {
        payload: { container, stage },
      }: PayloadAction<{ container: playbook.StageContainer; stage: playbook.StageReference }>
    ) => {
      getStageContainer(state.playbook, container).push(stage);
      state.dirty = true;
    },
    moveStage: (
      state,
      {
        payload: { location, to },
      }: PayloadAction<{
        location: playbook.StageLocation;
        to: number;
      }>
    ) => {
      arrayMoveMutable(getStageContainer(state.playbook, location), location.stageIndex, to);
      state.dirty = true;
    },
    removeStage: (state, { payload }: PayloadAction<playbook.StageLocation>) => {
      const container = getStageContainer(state.playbook, payload);
      container.splice(payload.stageIndex, 1);
      state.dirty = true;
    },
  },

  extraReducers: (builder) => {
    builder.addCase(showScanconfOperation, (state, { payload: { oas, scanconf } }) => {
      const [parsed, parseError] = jsonParse(scanconf);
      if (parseError !== undefined) {
        state.gerror = { message: `Failed to parse scan configuration: ${parseError}` };
        return;
      }
      const [playbook, error] = parse(oas, parsed);
      if (error !== undefined) {
        const message = error.map((e) => `${e.message}: ${e.pointer}`).join(" ");
        state.gerror = { message };
        return;
      }
      state.oas = oas;
      state.scanconf = parsed;
      state.playbook = playbook;
      state.servers = getServerUrls(oas);

      // select first credential
      state.selectedCredentialGroup = 0;
      state.selectedCredential = Object.keys(playbook?.authenticationDetails?.[0] || {})?.[0];
      if (state.selectedCredential !== undefined) {
        state.selectedSubcredential = Object.keys(
          playbook?.authenticationDetails[0][state.selectedCredential]?.methods
        )?.[0];
      }
    });
  },
});

function getStageContainer(
  playbook: playbook.PlaybookBundle,
  container: playbook.StageContainer
): playbook.Stage[] {
  if (container.container === "operationScenarios") {
    return playbook.operations[container.operationId].scenarios[container.scenarioIndex].requests;
  } else if (container.container === "operationBefore") {
    return playbook.operations[container.operationId].before;
  } else if (container.container === "operationAfter") {
    return playbook.operations[container.operationId].after;
  } else if (container.container === "globalBefore") {
    return playbook.before;
  } else if (container.container === "globalAfter") {
    return playbook.after;
  } else if (container.container === "credential") {
    return playbook.authenticationDetails[container.group][container.credentialId].methods[
      container.subCredentialId
    ].requests;
  }
  return null as any;
}

export const {
  loadScanconf,
  saveSettings,
  saveEnvironment,
  saveScanconf,
  addCredential,
  addStage,
  moveStage,
  removeStage,
  saveOperationReference,
  saveCredential,
  selectCredential,
  selectSubcredential,
  updateScanconf,
  saveRequest,
  removeRequest,
} = slice.actions;

export default slice.reducer;

export function arrayMoveMutable(array: unknown[], fromIndex: number, toIndex: number) {
  const startIndex = fromIndex < 0 ? array.length + fromIndex : fromIndex;

  if (startIndex >= 0 && startIndex < array.length) {
    const endIndex = toIndex < 0 ? array.length + toIndex : toIndex;

    const [item] = array.splice(fromIndex, 1);
    array.splice(endIndex, 0, item);
  }
}

function jsonParse(value: string): Result<any, string> {
  try {
    return [JSON.parse(value), undefined];
  } catch (e) {
    return [undefined, `${e}`];
  }
}
