import * as vscode from "vscode";
import { PlatformStore } from "../../stores/platform-store";
import { TextEncoder } from "node:util";

export async function createScanConfigWithPlatform(
  store: PlatformStore,
  scanconfUri: vscode.Uri,
  oas: string
): Promise<void> {
  const tmpApi = await store.createTempApi(oas);

  const report = await store.getAuditReport(tmpApi.apiId);

  if (report?.data.openapiState !== "valid") {
    await store.clearTempApi(tmpApi);
    throw new Error(
      "Your API has structural or semantic issues in its OpenAPI format. Run Security Audit on this file and fix these issues first."
    );
  }

  await store.createDefaultScanConfig(tmpApi.apiId);

  const configs = await store.getScanConfigs(tmpApi.apiId);

  const c = await store.readScanConfig(configs[0].configuration.id);

  const config = JSON.parse(Buffer.from(c.file, "base64").toString("utf-8"));

  await store.clearTempApi(tmpApi);

  if (config === undefined) {
    throw new Error("Failed to load default scan configuration from the platform");
  }

  const encoder = new TextEncoder();
  await vscode.workspace.fs.writeFile(scanconfUri, encoder.encode(JSON.stringify(config, null, 2)));
}

export async function createDefaultConfigWithPlatform(
  store: PlatformStore,
  oas: string
): Promise<string> {
  const tmpApi = await store.createTempApi(oas);

  const report = await store.getAuditReport(tmpApi.apiId);

  if (report?.data.openapiState !== "valid") {
    await store.clearTempApi(tmpApi);
    throw new Error(
      "Your API has structural or semantic issues in its OpenAPI format. Run Security Audit on this file and fix these issues first."
    );
  }
  await store.createDefaultScanConfig(tmpApi.apiId);

  const configs = await store.getScanConfigs(tmpApi.apiId);

  const c = await store.readScanConfig(configs[0].configuration.id);

  const config = JSON.parse(Buffer.from(c.file, "base64").toString("utf-8"));

  await store.clearTempApi(tmpApi);

  if (config === undefined) {
    throw new Error("Failed to load default scan configuration from the platform");
  }

  return JSON.stringify(config, null, 2);
}
