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
import { Result } from "@xliic/result";

export async function getCaptureConnection(
  configuration: Configuration,
  secrets: vscode.SecretStorage,
  useDevEndpoints: boolean,
  logger: Logger
): Promise<Result<CaptureConnection, unknown>> {
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

  return [undefined, "No valid credentials found for capture connection"];
}

export type CaptureConnection = {
  token: string;
  captureInstanceUrl: string;
};

export async function requestDiscover(
  credentials: any,
  useDevEndpoints: boolean,
  logger: Logger
): Promise<Result<CaptureConnection, unknown>> {
  const { freemiumdUrl } = getEndpoints(useDevEndpoints);
  try {
    const response = await got("api/v1/anon/discover", {
      prefixUrl: vscode.Uri.parse(freemiumdUrl).with({ path: "" }).toString(),
      method: "POST",
      responseType: "json",
      json: credentials,
      hooks: getHooks("POST", logger),
    });
    return [response.body as unknown as CaptureConnection, undefined];
  } catch (error) {
    return [undefined, error || "Unknown error during capture discover"];
  }
}

export async function requestPrepare(
  capture: CaptureConnection,
  prepareOptions: PrepareOptions,
  logger: Logger
): Promise<Result<string, unknown>> {
  try {
    const response = await got("capture/api/1.0/quickgen/prepare", {
      ...gotOptions(capture, "POST", logger),
      json: {
        base_path: prepareOptions.basePath,
        servers: prepareOptions.servers,
      },
    });
    return [(response.body as any)["quickgen_id"], undefined];
  } catch (error) {
    return [undefined, error || "Unknown error during capture prepare"];
  }
}

export async function requestUpload(
  capture: CaptureConnection,
  quickgenId: string,
  data_file: string,
  env_file: string | undefined,
  listener: (percent: number) => void,
  logger: Logger
): Promise<Result<string, unknown>> {
  const form = new FormData();
  form.append("data_file", fs.createReadStream(vscode.Uri.parse(data_file).fsPath));
  if (env_file) {
    form.append("env_file", fs.createReadStream(vscode.Uri.parse(env_file).fsPath));
  }

  try {
    const response = await got(`capture/api/1.0/quickgen/${quickgenId}/prepare/upload-file`, {
      ...gotOptions(capture, "POST", logger),
      body: form,
    }).on("uploadProgress", (progress) => {
      listener(progress.percent);
    });

    return [(response.body as any).file_id, undefined];
  } catch (error) {
    return [undefined, error || "Unknown error during capture upload"];
  }
}

export async function requestStart(
  capture: CaptureConnection,
  quickgenId: string,
  logger: Logger
): Promise<Result<unknown, unknown>> {
  try {
    const response = await got(`capture/api/1.0/quickgen/${quickgenId}/execution/start`, {
      ...gotOptions(capture, "POST", logger),
    });
    return [response.body || {}, undefined];
  } catch (error) {
    return [undefined, error || "Unknown error executing capture start"];
  }
}

export async function requestStatus(
  capture: CaptureConnection,
  quickgenId: string,
  logger: Logger
): Promise<Result<string, unknown>> {
  try {
    const response = await got(`capture/api/1.0/quickgen/${quickgenId}/execution/status`, {
      ...gotOptions(capture, "GET", logger),
    });
    return [(response.body as any)["status"], undefined];
  } catch (error) {
    return [undefined, error || "Unknown error getting capture status"];
  }
}

export async function requestSummary(
  capture: CaptureConnection,
  quickgenId: string,
  fileId: string,
  logger: Logger
): Promise<Result<string[], unknown>> {
  try {
    const response = await got(
      `capture/api/1.0/quickgen/${quickgenId}/prepare/summary/files/${fileId}`,
      {
        ...gotOptions(capture, "GET", logger),
      }
    );

    const errors = Array.isArray((response.body as any)?.errors)
      ? (response.body as any)?.errors.map((err: any) => err?.detail)
      : [];

    return [errors, undefined];
  } catch (error) {
    return [undefined, error || "Unknown error getting capture summary"];
  }
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
): Promise<Result<any, string>> {
  try {
    const response = await got(`capture/api/1.0/quickgen/${quickgenId}/delete`, {
      ...gotOptions(capture, "DELETE", logger),
    });
    return [response.body, undefined];
  } catch (error) {
    return [undefined, `Failed to delete capture: ${error}`];
  }
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
