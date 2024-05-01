import { simpleClone } from "@xliic/preserving-json-yaml-parser";
import { Scanconf } from "@xliic/scanconf";

export function updateReferences(
  scanconf: Scanconf.ConfigurationFileBundle,
  oldRef: string,
  newRef: string
): Scanconf.ConfigurationFileBundle {
  const updated = simpleClone(scanconf);

  updateContainer(updated.before, oldRef, newRef);
  updateContainer(updated.after, oldRef, newRef);

  for (const operation of Object.values(updated.operations || {})) {
    updateContainer(operation.before, oldRef, newRef);
    updateContainer(operation.after, oldRef, newRef);
    for (const scenario of operation.scenarios) {
      updateContainer(scenario.requests, oldRef, newRef);
    }
  }

  for (const group of updated.authenticationDetails || []) {
    // TODO: handle $ref only credentials
    for (const credential of Object.values(group) as Scanconf.Credential[]) {
      for (const credentialValue of Object.values(credential.credentials)) {
        updateContainer(credentialValue.requests, oldRef, newRef);
      }
    }
  }

  return updated;
}

function updateContainer(
  container: Scanconf.RequestsStage | undefined,
  oldRef: string,
  newRef: string
) {
  for (const stage of container || []) {
    if (stage.$ref === oldRef) {
      stage.$ref = newRef;
    }
  }
}
