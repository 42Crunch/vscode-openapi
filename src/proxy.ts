import { Config } from "@xliic/common/config";
import * as vscode from "vscode";
import { Logger } from "./platform/types";

const proxyAgent: any | undefined = loadVSCodeModule<any>("@vscode/proxy-agent");

function loadVSCodeModule<T>(moduleName: string): T | undefined {
  const appRoot = vscode.env.appRoot;
  try {
    return require(`${appRoot}/node_modules.asar/${moduleName}`);
  } catch (err) {
    // Not in ASAR.
  }
  try {
    return require(`${appRoot}/node_modules/${moduleName}`);
  } catch (err) {
    // Not available.
  }
  return undefined;
}

async function getProxyURL(targetUrl: string): Promise<string | undefined> {
  if (proxyAgent && proxyAgent.resolveProxyURL) {
    return await proxyAgent.resolveProxyURL(targetUrl);
  }
}

export async function getProxyEnv(
  backendUrl: string,
  apiUrl: string | undefined,
  config: Config,
  logger: Logger
): Promise<Record<string, string>> {
  const env: Record<string, string> = {};

  const freemiumdProxy = await getProxyURL(backendUrl);
  if (freemiumdProxy) {
    env["HTTPS_PROXY"] = freemiumdProxy;
    logger.debug(`Set HTTPS_PROXY environment variable to: ${freemiumdProxy}`);
  }

  if (apiUrl !== undefined) {
    const scanProxy = config.scanProxy.trim();
    if (scanProxy !== "") {
      env["HTTP_PROXY_API"] = scanProxy;
      env["HTTPS_PROXY_API"] = scanProxy;
      logger.debug(
        `Set HTTPS_PROXY_API and HTTP_PROXY_API environment variables using 'API Scan proxy' setting to: ${scanProxy}`
      );
    } else {
      const apiProxy = await getProxyURL(apiUrl);
      if (apiProxy) {
        env["HTTP_PROXY_API"] = apiProxy;
        env["HTTPS_PROXY_API"] = apiProxy;
        logger.debug(
          `Set HTTPS_PROXY_API and HTTP_PROXY_API environment variables to: ${apiProxy}`
        );
      }
    }
  }

  return env;
}
