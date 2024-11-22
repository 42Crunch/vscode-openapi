import * as vscode from "vscode";

import { Config, ApprovedHostConfiguration } from "@xliic/common/config";
import { Configuration } from "../configuration";
import { getCliInfo } from "../platform/cli-ast";

export async function loadConfig(
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<Config> {
  const platformAuthType = configuration.get<Config["platformAuthType"] | "">("platformAuthType");
  const platformUrl = configuration.get<string>("platformUrl")?.trim();
  const anondToken = configuration.get<string>("securityAuditToken");
  const apiToken = (await secrets.get("platformApiToken")) ?? "";
  const insecureSslHostnames = configuration.get<string[]>("tryit.insecureSslHostnames");
  const platformServices = configuration.get<string>("platformServices");
  const scandManager = configuration.get<Config["scandManager"]>("platformScandManager");
  const docker = configuration.get<Config["docker"]>("docker");
  const cliDirectoryOverride = configuration.get<string>("cliDirectoryOverride");

  const auditRuntime = configuration.get<"platform" | "cli">("platformAuditRuntime");
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
  const derivedAuthType = !anondToken && !!apiToken ? "api-token" : "anond-token";
  const approvedHosts = await getApprovedHostsConfiguration(configuration, secrets);

  return {
    platformUrl,
    platformAuthType: platformAuthType == "" ? derivedAuthType : platformAuthType,
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
    auditRuntime,
    scanRuntime,
    scanImage,
    docker,
    platform: process.platform,
    cli: getCliInfo(cliDirectoryOverride),
    cliDirectoryOverride,
    repository,
    platformTemporaryCollectionName,
    platformMandatoryTags,
    approvedHosts,
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
    "platformAuditRuntime",
    config.auditRuntime,
    vscode.ConfigurationTarget.Global
  );

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
    "cliDirectoryOverride",
    config.cliDirectoryOverride,
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

  await processApprovedHosts(configuration, secrets, config.approvedHosts);
}

export function deriveServices(platformUrl: string): string {
  const platformHost = vscode.Uri.parse(platformUrl).authority;
  if (platformHost.toLowerCase().startsWith("platform")) {
    return platformHost.replace(/^platform/i, "services") + ":8001";
  }
  return "services." + platformHost + ":8001";
}

export async function processApprovedHosts(
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  approvedHosts: ApprovedHostConfiguration[]
) {
  const updateApprovedHostnames = approvedHosts.map((hostConfig) => hostConfig.host.trim());
  const lcaseUpdateApprovedHostnames = updateApprovedHostnames.map((hostname) =>
    hostname.toLowerCase()
  );

  const currentApprovedHostnames = getApprovedHostnames(configuration);

  const removedHostnames = currentApprovedHostnames.filter(
    (currentHost) => !lcaseUpdateApprovedHostnames.includes(currentHost.trim().toLowerCase())
  );

  // remove secrets for deleted hostnames
  await removeSecretsForApprovedHosts(secrets, removedHostnames);

  // save new secrets
  await Promise.all(
    approvedHosts.flatMap((hostConfigUpdate) => [
      secrets.store(
        getHostConfigurationSecretKeyFor(hostConfigUpdate.host, "header"),
        hostConfigUpdate.header || ""
      ),
      secrets.store(
        getHostConfigurationSecretKeyFor(hostConfigUpdate.host, "prefix"),
        hostConfigUpdate.prefix || ""
      ),
      secrets.store(
        getHostConfigurationSecretKeyFor(hostConfigUpdate.host, "token"),
        hostConfigUpdate.token || ""
      ),
    ])
  );

  // update hostnames configuration
  await configuration.update(
    "approvedHostnames",
    updateApprovedHostnames,
    vscode.ConfigurationTarget.Global
  );
}

export async function removeSecretsForApprovedHosts(
  secrets: vscode.SecretStorage,
  removed: string[]
) {
  return Promise.all(
    removed.flatMap((removedHost) => {
      const lcHost = removedHost.trim().toLowerCase();
      return [
        secrets.delete(getHostConfigurationSecretKeyFor(lcHost, "header")),
        secrets.delete(getHostConfigurationSecretKeyFor(lcHost, "prefix")),
        secrets.delete(getHostConfigurationSecretKeyFor(lcHost, "token")),
      ];
    })
  );
}

export function getApprovedHostnames(configuration: Configuration): string[] {
  return configuration.get<string[]>("approvedHostnames", []);
}

export function getApprovedHostnamesTrimmedLowercase(configuration: Configuration): string[] {
  return getApprovedHostnames(configuration).map((name) => name.trim().toLowerCase());
}

export async function getApprovedHostConfiguration(
  secrets: vscode.SecretStorage,
  host: string
): Promise<ApprovedHostConfiguration | undefined> {
  const sanitizedHost = host.trim().toLowerCase();
  if (!sanitizedHost) {
    return undefined;
  }

  const [header, prefix, token] = (
    await Promise.all([
      secrets.get(getHostConfigurationSecretKeyFor(sanitizedHost, "header")),
      secrets.get(getHostConfigurationSecretKeyFor(sanitizedHost, "prefix")),
      secrets.get(getHostConfigurationSecretKeyFor(sanitizedHost, "token")),
    ])
  ).map((conf) => conf || "");

  return { host: host.trim(), header, prefix, token };
}

async function getApprovedHostsConfiguration(
  configuration: Configuration,
  secrets: vscode.SecretStorage
): Promise<ApprovedHostConfiguration[]> {
  const approvedHostnames = getApprovedHostnames(configuration);
  return (
    await Promise.all(approvedHostnames.map((host) => getApprovedHostConfiguration(secrets, host)))
  ).filter((hostConfig) => hostConfig !== undefined) as ApprovedHostConfiguration[];
}

export function getHostConfigurationSecretKeyBase(): string {
  return "openapi-external-refs-host";
}

export function getHostConfigurationSecretKeyFor(host: string, group: string): string {
  return `${getHostConfigurationSecretKeyBase()}-${group}-${host}`;
}
