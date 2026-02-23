import { TypedStartListening } from "@reduxjs/toolkit";

import { Webapp } from "@xliic/common/webapp/scanconf-graphql";
import { Result } from "@xliic/result";

import { showGeneralError } from "../../../features/general-error/slice";
import { goTo } from "../../../features/router/slice";
import { loadPlaybook, loadUpdatedScanconf, showScanconfOperation } from "../actions";
import { AppDispatch, RootState } from "../store";
import { makeGqlHelpers, parse } from "@xliic/scanconf/dist/parser";

export function onShowScanconf(startAppListening: TypedStartListening<RootState, AppDispatch>) {
  return () =>
    startAppListening({
      actionCreator: showScanconfOperation,
      effect: async ({ payload: { graphQl, scanconf } }, listenerApi) => {
        const [parsed, parseError] = jsonParse(scanconf);
        if (parseError !== undefined) {
          listenerApi.dispatch(
            showGeneralError({ message: `Failed to parse scan configuration: ${parseError}` })
          );
          listenerApi.dispatch(goTo(["general-error"]));
          return;
        }
        const [playbook, error] = parse(makeGqlHelpers(), parsed);
        if (error !== undefined) {
          const message = error.map((e) => `${e.message}: ${e.pointer}`).join(" ");
          listenerApi.dispatch(showGeneralError({ message }));
          listenerApi.dispatch(goTo(["general-error"]));
          return;
        }

        listenerApi.dispatch(loadPlaybook({ playbook, graphQl }));
        listenerApi.dispatch(goTo(["scanconf", "requests"]));
      },
    });
}

export function onLoadUpdatedScanconf(
  startAppListening: TypedStartListening<RootState, AppDispatch>,
  host: Webapp["host"]
) {
  return () =>
    startAppListening({
      actionCreator: loadUpdatedScanconf,
      effect: async ({ payload: { graphQl, scanconf: updatedScanconf } }, listenerApi) => {
        const { changes, scanconf: originalScanconf } = listenerApi.getState().scanconfUpdate;
        const [original, originalParseError] = jsonParse(originalScanconf);

        if (originalParseError !== undefined) {
          listenerApi.dispatch(
            showGeneralError({
              message: `Failed to parse original scan configuration: ${originalParseError}`,
            })
          );
          listenerApi.dispatch(goTo(["general-error"]));
          return;
        }

        const [updated, updatedParseError] = jsonParse(updatedScanconf);
        if (updatedParseError !== undefined) {
          listenerApi.dispatch(
            showGeneralError({
              message: `Failed to parse updated scan configuration: ${updatedParseError}`,
            })
          );
          listenerApi.dispatch(goTo(["general-error"]));
          return;
        }
        const playbook = updated;
        listenerApi.dispatch(loadPlaybook({ playbook, graphQl }));
        listenerApi.dispatch(goTo(["scanconf", "requests"]));
      },
    });
}

function jsonParse(value: string): Result<any, string> {
  try {
    return [JSON.parse(value), undefined];
  } catch (e) {
    return [undefined, `${e}`];
  }
}
