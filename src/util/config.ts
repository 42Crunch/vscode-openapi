import * as vscode from "vscode";

import { Config } from "@xliic/common/config";
import { Configuration } from "../configuration";

export async function loadConfig(
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<Config> {
  const platformUrl = configuration.get<string>("platformUrl");
  const apiToken = (await secrets.get("platformApiToken")) ?? "";
  const insecureSslHostnames = configuration.get<string[]>("tryit.insecureSslHostnames");
  const platformServices = configuration.get<string>("platformServices");
  const scandManager = configuration.get<Config["scandManager"]>("platformScandManager");
  const docker = configuration.get<Config["docker"]>("docker");

  const scanRuntime = configuration.get<"docker" | "scand-manager">(
    "platformConformanceScanRuntime"
  );
  const scanImage = configuration.get<"string">("platformConformanceScanImage");
  const scandManagerHeader = await secrets.get("platformScandManagerHeader");

  return {
    platformUrl,
    platformApiToken: apiToken,
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
  };
}

export async function saveConfig(
  config: Config,
  configuration: Configuration,
  secrets: vscode.SecretStorage
) {
  await configuration.update("platformUrl", config.platformUrl);

  if (config.platformServices.source === "auto") {
    await configuration.update("platformServices", "");
  } else {
    await configuration.update("platformServices", config.platformServices.manual);
  }

  await configuration.update("platformScandManager", config.scandManager);
  await configuration.update("docker", config.docker);
  await configuration.update("platformConformanceScanRuntime", config.scanRuntime);
  await configuration.update("platformConformanceScanImage", config.scanImage);
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
