import { TypedStartListening } from "@reduxjs/toolkit";

import { parse } from "@xliic/scanconf";
import { Result } from "@xliic/result";
import { compare, update } from "@xliic/scanconf-changes";
import { Webapp } from "@xliic/common/webapp/scanconf";

import { goTo } from "../../../features/router/slice";
import { AppDispatch, RootState } from "../store";
import { showScanconfOperation, loadPlaybook, loadUpdatedScanconf } from "../actions";
import { showChanges } from "../scanconf-update/slice";
import { showGeneralError } from "../../../features/general-error/slice";

export function onShowScanconf(startAppListening: TypedStartListening<RootState, AppDispatch>) {
  return () =>
    startAppListening({
      actionCreator: showScanconfOperation,
      effect: async ({ payload: { oas, scanconf } }, listenerApi) => {
        const [parsed, parseError] = jsonParse(scanconf);
        if (parseError !== undefined) {
          listenerApi.dispatch(
            showGeneralError({ message: `Failed to parse scan configuration: ${parseError}` })
          );
          listenerApi.dispatch(goTo(["general-error"]));
          return;
        }

        const changes = compare(oas, parsed);

        if (changes.length > 0) {
          listenerApi.dispatch(showChanges({ scanconf, oas, changes }));
          listenerApi.dispatch(goTo(["scanconf-update"]));
          return;
        }

        const [playbook, error] = parse(oas, parsed);
        if (error !== undefined) {
          const message = error.map((e) => `${e.message}: ${e.pointer}`).join(" ");
          listenerApi.dispatch(showGeneralError({ message }));
          listenerApi.dispatch(goTo(["general-error"]));
          return;
        }

        listenerApi.dispatch(loadPlaybook({ playbook, oas }));
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
      effect: async ({ payload: { oas, scanconf: updatedScanconf } }, listenerApi) => {
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

        const patched = update(oas, original, updated, changes);

        const [playbook, playbookError] = parse(oas, patched);
        if (playbookError !== undefined) {
          const message = playbookError.map((e) => `${e.message}: ${e.pointer}`).join(" ");
          listenerApi.dispatch(showGeneralError({ message }));
          listenerApi.dispatch(goTo(["general-error"]));
          return;
        }

        host.postMessage({
          command: "saveScanconf",
          payload: JSON.stringify(patched, null, 2),
        });

        listenerApi.dispatch(loadPlaybook({ playbook, oas }));
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
