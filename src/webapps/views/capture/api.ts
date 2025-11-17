import * as fs from "fs";
import * as vscode from "vscode";
import FormData from "form-data";
import got, { Method, OptionsOfJSONResponseBody } from "got";

import { PrepareOptions } from "@xliic/common/capture";
import { getEndpoints } from "@xliic/common/endpoints";

import { Configuration } from "../../../configuration";
import { getAnondCredentials, getPlatformCredentials, hasCredentials } from "../../../credentials";
import { getHooks } from "../../http-handler";
import { Logger } from "../../../platform/types";

export async function getCaptureConnection(
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  useDevEndpoints: boolean,
  logger: Logger
): Promise<CaptureConnection | undefined> {
  const credentialType = await hasCredentials(configuration, secrets);

  if (credentialType === "anond-token") {
    const anondToken = getAnondCredentials(configuration);
    return requestDiscover({ freemiumToken: anondToken }, useDevEndpoints, logger);
  } else if (credentialType === "api-token") {
    const platformCredentials = await getPlatformCredentials(configuration, secrets);
    return requestDiscover(
      { platformUrl: platformCredentials?.platformUrl, apiKey: platformCredentials?.apiToken },
      useDevEndpoints,
      logger
    );
  }
}

export type CaptureConnection = {
  token: string;
  captureInstanceUrl: string;
};

export async function requestDiscover(
  credentials: any,
  useDevEndpoints: boolean,
  logger: Logger
): Promise<CaptureConnection> {
  const { freemiumdUrl } = getEndpoints(useDevEndpoints);
  try {
    const response = await got("api/v1/anon/discover", {
      prefixUrl: vscode.Uri.parse(freemiumdUrl).with({ path: "" }).toString(),
      method: "POST",
      responseType: "json",
      json: credentials,
      hooks: getHooks("POST", logger),
    });
    return response.body as unknown as CaptureConnection;
  } catch (error) {
    throw new Error(`Failed to discover capture instance: ${error}`);
  }
}

export async function requestPrepare(
  capture: CaptureConnection,
  prepareOptions: PrepareOptions,
  logger: Logger
) {
  const response = await got("capture/api/1.0/quickgen/prepare", {
    ...gotOptions(capture, "POST", logger),
    json: {
      base_path: prepareOptions.basePath,
      servers: prepareOptions.servers,
    },
  });
  return (response.body as any)["quickgen_id"];
}

export async function requestUpload(
  capture: CaptureConnection,
  quickgenId: string,
  files: string[],
  listener: (percent: number) => void,
  logger: Logger
) {
  const form = new FormData();
  for (const uri of files) {
    const fsPath = vscode.Uri.parse(uri).fsPath;
    const fileType = checkFileType(fsPath);
    if (fileType === "env_file") {
      form.append("env_file", fs.createReadStream(fsPath));
    } else {
      form.append("data_file", fs.createReadStream(fsPath));
    }
  }
  const response = await got(`capture/api/1.0/quickgen/${quickgenId}/prepare/upload-file`, {
    ...gotOptions(capture, "POST", logger),
    body: form,
  }).on("uploadProgress", (progress) => {
    listener(progress.percent);
  });
  return response.body;
}

export async function requestStart(capture: CaptureConnection, quickgenId: string, logger: Logger) {
  const response = await got(`capture/api/1.0/quickgen/${quickgenId}/execution/start`, {
    ...gotOptions(capture, "POST", logger),
  });
  return response.body;
}

export async function requestStatus(
  capture: CaptureConnection,
  quickgenId: string,
  logger: Logger
) {
  const response = await got(`capture/api/1.0/quickgen/${quickgenId}/execution/status`, {
    ...gotOptions(capture, "GET", logger),
  });
  return (response.body as any)["status"];
}

export async function requestDownload(
  capture: CaptureConnection,
  quickgenId: string,
  logger: Logger
) {
  const response = await got(`capture/api/1.0/quickgen/${quickgenId}/results/openapi`, {
    ...gotOptions(capture, "GET", logger),
  });
  return response.body;
}

export async function requestDelete(
  capture: CaptureConnection,
  quickgenId: string,
  logger: Logger
) {
  const response = await got(`capture/api/1.0/quickgen/${quickgenId}/delete`, {
    ...gotOptions(capture, "DELETE", logger),
  });
  return response.body;
}

function gotOptions(
  capture: CaptureConnection,
  method: Method,
  logger: Logger
): OptionsOfJSONResponseBody {
  const prefixUrl = vscode.Uri.parse(capture.captureInstanceUrl).with({ path: "" }).toString();
  return {
    method,
    prefixUrl,
    headers: {
      Authorization: `Token ${capture.token}`,
    },
    responseType: "json",
    hooks: getHooks(method, logger),
  };
}

function checkFileType(filePath: string): "env_file" | "postman_file" | "other" {
  const parsed = parseFile(filePath);

  if (parsed !== undefined && typeof parsed === "object" && Array.isArray(parsed?.["values"])) {
    return "env_file";
  } else if (parsed !== undefined && typeof parsed === "object") {
    return "postman_file";
  }

  return "other";
}

function parseFile(filePath: string): any {
  if (filePath.endsWith(".json")) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
}
