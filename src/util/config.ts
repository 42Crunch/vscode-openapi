import * as vscode from "vscode";

import { Config } from "@xliic/common/config";
import { Configuration } from "../configuration";
import { getCliInfo } from "../platform/cli-ast";

export async function loadConfig(
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<Config> {
  const platformAuthType = configuration.get<Config["platformAuthType"] | "">("platformAuthType");
  const platformUrl = configuration.get<string>("platformUrl");
  const anondToken = configuration.get<string>("securityAuditToken");
  const apiToken = (await secrets.get("platformApiToken")) ?? "";
  const insecureSslHostnames = configuration.get<string[]>("tryit.insecureSslHostnames");
  const platformServices = configuration.get<string>("platformServices");
  const scandManager = configuration.get<Config["scandManager"]>("platformScandManager");
  const docker = configuration.get<Config["docker"]>("docker");

  const scanRuntime = configuration.get<"docker" | "scand-manager" | "cli">(
    "platformConformanceScanRuntime"
  );
  const scanImage = configuration.get<"string">("platformConformanceScanImage");
  const scandManagerHeader = await secrets.get("platformScandManagerHeader");
  const repository = configuration.get<"string">("platformRepository");

  const platformTemporaryCollectionName = configuration.get<"string">(
    "platformTemporaryCollectionName"
  );

  const platformMandatoryTags = configuration.get<"string">("platformMandatoryTags");

  // derived auth type is api-token only if anondToken is not set and apiToken is set, otherwise it is anond-token
  const derivedAutType = !anondToken && !!apiToken ? "api-token" : "anond-token";

  return {
    platformUrl,
    platformAuthType: platformAuthType == "" ? derivedAutType : platformAuthType,
    platformApiToken: apiToken,
    anondToken,
    insecureSslHostnames,
    platformServices: {
      source: platformServices === "" ? "auto" : "manual",
      manual: platformServices,
      auto: deriveServices(platformUrl),
    },
    scandManager: {
      ...scandManager,
      header:
        scandManagerHeader !== undefined ? JSON.parse(scandManagerHeader) : { name: "", value: "" },
    },
    scanRuntime,
    scanImage,
    docker,
    platform: process.platform,
    cli: getCliInfo(),
    repository,
    platformTemporaryCollectionName,
    platformMandatoryTags,
  };
}

export async function saveConfig(
  config: Config,
  configuration: Configuration,
  secrets: vscode.SecretStorage
) {
  await configuration.update("platformUrl", config.platformUrl, vscode.ConfigurationTarget.Global);

  await configuration.update(
    "platformAuthType",
    config.platformAuthType,
    vscode.ConfigurationTarget.Global
  );

  await configuration.update(
    "securityAuditToken",
    config.anondToken,
    vscode.ConfigurationTarget.Global
  );

  if (config.platformServices.source === "auto") {
    await configuration.update("platformServices", "", vscode.ConfigurationTarget.Global);
  } else {
    await configuration.update(
      "platformServices",
      config.platformServices.manual,
      vscode.ConfigurationTarget.Global
    );
  }

  await configuration.update(
    "platformScandManager",
    config.scandManager,
    vscode.ConfigurationTarget.Global
  );
  await configuration.update("docker", config.docker, vscode.ConfigurationTarget.Global);
  await configuration.update(
    "platformConformanceScanRuntime",
    config.scanRuntime,
    vscode.ConfigurationTarget.Global
  );
  await configuration.update(
    "platformConformanceScanImage",
    config.scanImage,
    vscode.ConfigurationTarget.Global
  );
  await configuration.update(
    "platformRepository",
    config.repository,
    vscode.ConfigurationTarget.Global
  );
  await configuration.update(
    "platformTemporaryCollectionName",
    config.platformTemporaryCollectionName,
    vscode.ConfigurationTarget.Global
  );
  await configuration.update(
    "platformMandatoryTags",
    config.platformMandatoryTags,
    vscode.ConfigurationTarget.Global
  );

  // secrets
  await secrets.store("platformApiToken", config.platformApiToken);
  if (config.scandManager.auth == "header") {
    await secrets.store("platformScandManagerHeader", JSON.stringify(config.scandManager.header));
  }
}

export function deriveServices(platformUrl: string): string {
  const platformHost = vscode.Uri.parse(platformUrl).authority;
  if (platformHost.toLowerCase().startsWith("platform")) {
    return platformHost.replace(/^platform/i, "services") + ":8001";
  }
  return "services." + platformHost + ":8001";
}
