import { TypedStartListening } from "@reduxjs/toolkit";

import { parse } from "@xliic/scanconf";
import { Result } from "@xliic/result";
import { compare } from "@xliic/scanconf-changes";

import { goTo } from "../../../features/router/slice";
import { AppDispatch, RootState } from "../store";
import { showScanconfOperation, loadPlaybook } from "../actions";
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

        console.log("got changes", changes);

        if (changes.length > 0) {
          listenerApi.dispatch(
            showGeneralError({ message: `Has changes: ${JSON.stringify(changes)}` })
          );
          listenerApi.dispatch(goTo(["general-error"]));
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
        listenerApi.dispatch(goTo(["scanconf", "operations"]));
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
