import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { GeneralError } from "@xliic/common/error";
import { BundledSwaggerOrOasSpec, getServerUrls } from "@xliic/common/openapi";
import * as playbook from "@xliic/common/playbook";
import { LoadScanconfMessage } from "@xliic/common/playbook";
import { parse } from "../../core/playbook/scanconf-parser";
import * as scan from "../../core/playbook/scanconfig";
import { showScanconfAuth, showScanconfOperation } from "./actions";

export type State = {
  oas: BundledSwaggerOrOasSpec;
  playbook: playbook.PlaybookBundle;
  scanconf?: scan.ConfigurationFileBundle;
  gerror?: GeneralError;
  dirty: boolean;
  servers: string[];
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
  servers: [],
};

export const slice = createSlice({
  name: "scanconf",
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
    saveRequest: (
      state,
      {
        payload: { ref, stage },
      }: PayloadAction<{
        ref: playbook.RequestRef;
        stage: playbook.StageContent;
      }>
    ) => {
      if (ref.type === "operation") {
        state.playbook.operations[ref.id].request = stage;
      } else if (state.playbook.requests) {
        state.playbook.requests[ref.id] = stage;
      }
    },
    saveCredential: (
      state,
      {
        payload: { id, credential },
      }: PayloadAction<{ id: string; credential: playbook.Credential }>
    ) => {
      state.playbook.authenticationDetails[0][id] = credential;
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
    builder.addCase(showScanconfAuth, (state, { payload: { oas, scanconf } }) => {
      state.oas = oas;
      state.scanconf = JSON.parse(scanconf);
      const [playbook, error] = parse(oas, state.scanconf!);
      if (error !== undefined) {
        const message = error.map((e) => `${e.message}: ${e.pointer}`).join(" ");
        state.gerror = { message };
        return;
      }
      state.playbook = playbook;
      state.servers = getServerUrls(oas);
    });

    builder.addCase(showScanconfOperation, (state, { payload: { oas, scanconf } }) => {
      state.oas = oas;
      state.scanconf = JSON.parse(scanconf);
      const [playbook, error] = parse(oas, state.scanconf!);
      if (error !== undefined) {
        const message = error.map((e) => `${e.message}: ${e.pointer}`).join(" ");
        state.gerror = { message };
        return;
      }
      state.playbook = playbook;
      state.servers = getServerUrls(oas);
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
  }
  return null as any;
}

export const {
  loadScanconf,
  saveScanconf,
  addCredential,
  addStage,
  moveStage,
  removeStage,
  saveOperationReference,
  saveCredential,
  updateScanconf,
  saveRequest,
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
