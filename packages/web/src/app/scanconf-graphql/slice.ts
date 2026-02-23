import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { BundledSwaggerOrOasSpec, getHttpResponseRange, getServerUrls } from "@xliic/openapi";
import { Playbook } from "@xliic/scanconf";

import { loadPlaybook } from "./actions";
import { arrayMoveMutable, getStageContainer } from "../scanconf/slice";
import { ENV_API_TOKEN } from "./auth/NewCredentialDialog";

export type State = {
  graphQl: string;
  playbook: Playbook.Bundle;
  servers: string[];

  selectedCredentialGroup: number;
  selectedCredential?: string;
  selectedSubcredential?: string;
  selectedAuthorizationTest?: string;
};

const initialState: State = {
  graphQl: "",
  playbook: {
    operations: {},
    requests: {},
    authenticationDetails: [{}],
    before: [],
    after: [],
    environments: {},
    authorizationTests: {},
  },
  servers: [],
  selectedCredentialGroup: 0,
};

export const slice = createSlice({
  name: "scanconf",
  initialState,
  reducers: {
    saveScanconf: (state) => {},

    saveSettings: (state, { payload: settings }: PayloadAction<Playbook.RuntimeConfiguration>) => {
      state.playbook.runtimeConfiguration = { ...state.playbook.runtimeConfiguration, ...settings };
    },

    saveRequest: (
      state,
      {
        payload: { ref, stage },
      }: PayloadAction<{
        ref: Playbook.RequestRef;
        stage: Playbook.StageContent | Playbook.ExternalStageContent;
      }>
    ) => {
      if (ref.type === "operation") {
        state.playbook.operations[ref.id].request = stage as Playbook.StageContent;
      } else if (state.playbook.requests) {
        state.playbook.requests[ref.id] = stage;
      }
    },

    removeRequest: (state, { payload: ref }: PayloadAction<Playbook.RequestRef>) => {
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
      }: PayloadAction<{ group: number; id: string; credential: Playbook.Credential }>
    ) => {
      const firstAvailable = Object.keys(credential.methods || {})[0];
      if (
        state.selectedSubcredential !== undefined &&
        credential?.methods?.[state.selectedSubcredential] === undefined
      ) {
        // subcredential was deleted, select first available one
        state.selectedSubcredential = firstAvailable;
      }
      if (credential.methods[credential.default] === undefined) {
        // no default credential, use the first available one
        credential.default = firstAvailable;
      }
      const myName = state.playbook.authenticationDetails[group][id].name as string;
      const oldValue = state.playbook.authenticationDetails[group][id].methods[id].credential;
      state.playbook.authenticationDetails[group][id] = credential;

      const oldKey = oldValue.replace("{{", "").replace("}}", "");
      const newValue = credential.methods[id].credential;
      const newKey = newValue.replace("{{", "").replace("}}", "");

      const headers = (state.playbook.customizations as any)["requests"].additionalHeaders;
      headers[myName] = newValue;
      const vars = state.playbook?.environments?.default?.variables as any;

      vars[newKey] = {
        from: "environment",
        name: "SCAN42C_" + ENV_API_TOKEN,
        required: true,
      };
      delete vars[oldKey];
    },

    saveEnvironment: (
      state,
      {
        payload: { name, environment },
      }: PayloadAction<{ name: string; environment: Playbook.Environment }>
    ) => {
      state.playbook.environments[name] = environment;
    },

    addCredential: (
      state,
      {
        payload: { credentialGroup, id, credential },
      }: PayloadAction<{ credentialGroup: number; id: string; credential: Playbook.Credential }>
    ) => {
      // check if no credential groups exists
      if (!state.playbook.authenticationDetails) {
        state.playbook.authenticationDetails = [{}];
      }
      if (state.playbook.authenticationDetails[credentialGroup] === undefined) {
        state.playbook.authenticationDetails[credentialGroup] = {};
      }
      // add credential
      (credential as any)["credentials"] = {
        [id]: {
          description: "",
          credential: "{{" + ENV_API_TOKEN + "}}",
        },
      };
      state.playbook.authenticationDetails[credentialGroup][id] = credential;
      (state.playbook.customizations as any)["requests"] = {
        additionalHeaders: {
          [credential.name as string]: "{{" + ENV_API_TOKEN + "}}",
        },
      };
      if (!(ENV_API_TOKEN in state.playbook?.environments?.default?.variables)) {
        (state.playbook?.environments?.default?.variables as any)[ENV_API_TOKEN] = {
          from: "environment",
          name: "SCAN42C_" + ENV_API_TOKEN,
          required: true,
        };
      }
    },

    removeCredential: (
      state,
      { payload: { credentialGroup, id } }: PayloadAction<{ credentialGroup: number; id: string }>
    ) => {
      delete state.playbook.authenticationDetails[credentialGroup][id];
      state.selectedCredential = undefined;
      state.selectedSubcredential = undefined;
      delete (state.playbook.customizations as any)["requests"];
      delete (state.playbook?.environments?.default?.variables as any)[ENV_API_TOKEN];
    },

    selectCredential: (
      state,
      { payload }: PayloadAction<{ group: number; credential: string }>
    ) => {
      state.selectedCredentialGroup = payload.group;
      state.selectedCredential = payload.credential;
    },

    selectSubcredential: (state, { payload }: PayloadAction<string>) => {
      state.selectedSubcredential = payload;
    },

    addAuthorizationTest: (
      state,
      {
        payload: { id, test },
      }: PayloadAction<{ id: string; test: Playbook.AuthenticationSwappingTest }>
    ) => {
      state.playbook.authorizationTests[id] = test;
    },

    saveAuthorizationTest: (
      state,
      {
        payload: { id, test },
      }: PayloadAction<{ id: string; test: Playbook.AuthenticationSwappingTest }>
    ) => {
      state.playbook.authorizationTests[id] = test;
    },

    removeAuthorizationTest: (state, { payload: { id } }: PayloadAction<{ id: string }>) => {
      delete state.playbook.authorizationTests[id];
      state.selectedAuthorizationTest = Object.keys(state.playbook.authorizationTests)?.[0];
    },

    selectAuthorizationTest: (state, { payload: { id } }: PayloadAction<{ id: string }>) => {
      state.selectedAuthorizationTest = id;
    },

    saveOperationReference: (
      state,
      {
        payload: { location, reference },
      }: PayloadAction<{
        location: Playbook.StageLocation;
        reference: Playbook.StageReference;
      }>
    ) => {
      getStageContainer(state.playbook, location)[location.stageIndex] = reference;
    },

    addStage: (
      state,
      {
        payload: { container, stage },
      }: PayloadAction<{ container: Playbook.StageContainer; stage: Playbook.StageReference }>
    ) => {
      getStageContainer(state.playbook, container).push(stage);
    },

    moveStage: (
      state,
      {
        payload: { location, to },
      }: PayloadAction<{
        location: Playbook.StageLocation;
        to: number;
      }>
    ) => {
      arrayMoveMutable(getStageContainer(state.playbook, location), location.stageIndex, to);
    },

    removeStage: (state, { payload }: PayloadAction<Playbook.StageLocation>) => {
      const container = getStageContainer(state.playbook, payload);
      container.splice(payload.stageIndex, 1);
    },

    updateOperationAuthorizationTests: (
      state,
      {
        payload: { operationId, authorizationTests },
      }: PayloadAction<{ operationId: string; authorizationTests: string[] }>
    ) => {
      state.playbook.operations[operationId].authorizationTests = authorizationTests;
    },

    customizeOperation: (state, { payload: operationId }: PayloadAction<string>) => {
      state.playbook.operations[operationId].customized = true;
    },

    removeCustomizationForOperation: (state, { payload: operationId }: PayloadAction<string>) => {
      state.playbook.operations[operationId].customTests = undefined;
      state.playbook.operations[operationId].authorizationTests = [];
      state.playbook.operations[operationId].before = [];
      state.playbook.operations[operationId].after = [];
      state.playbook.operations[operationId].scenarios = [
        {
          key: "happy.path",
          requests: [
            {
              fuzzing: true,
              ref: { type: "operation", id: operationId },
            },
          ],
          fuzzing: true,
        },
      ];
      state.playbook.operations[operationId].customized = false;
    },

    createVariable: (
      state,
      {
        payload: { name, location, jsonPointer, ref, statusCode },
      }: PayloadAction<{
        name: string;
        location: "request" | "response";
        jsonPointer: string;
        ref: Playbook.RequestRef;
        statusCode: number;
      }>
    ) => {
      const target =
        ref.type === "operation"
          ? state.playbook.operations[ref.id].request
          : state.playbook.requests[ref.id];

      const responseRange = getHttpResponseRange(statusCode);

      const responseCode = target.responses[statusCode]
        ? statusCode
        : responseRange !== undefined && target.responses[responseRange]
        ? responseRange
        : "default";

      if (target.responses[responseCode] === undefined) {
        target.responses[responseCode] = {
          variableAssignments: {},
          expectations: responseCode,
        };
      }

      target.responses[responseCode].variableAssignments[name] = {
        from: location,
        in: "body",
        contentType: "json",
        path: {
          type: "jsonPointer",
          value: jsonPointer,
        },
      };
    },
  },

  extraReducers: (builder) => {
    builder.addCase(loadPlaybook, (state, { payload: { graphQl, playbook } }) => {
      state.graphQl = graphQl;
      state.playbook = playbook;
      state.servers = [];

      // select first credential
      state.selectedCredentialGroup = 0;
      state.selectedCredential = Object.keys(playbook?.authenticationDetails?.[0] || {})?.[0];

      // select first authorization test
      state.selectedAuthorizationTest = Object.keys(playbook?.authorizationTests || {})?.[0];
    });
  },
});

export const {
  saveSettings,
  saveEnvironment,
  saveScanconf,
  addCredential,
  removeCredential,
  addStage,
  moveStage,
  removeStage,
  saveOperationReference,
  saveCredential,
  selectCredential,
  selectSubcredential,
  addAuthorizationTest,
  saveAuthorizationTest,
  removeAuthorizationTest,
  selectAuthorizationTest,
  saveRequest,
  removeRequest,
  updateOperationAuthorizationTests,
  customizeOperation,
  removeCustomizationForOperation,
  createVariable,
} = slice.actions;

export default slice.reducer;
