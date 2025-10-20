import { URL } from "url";
import * as vscode from "vscode";

import { Config } from "@xliic/common/config";

import { Logger } from "./platform/types";

const proxyAgentModule: any | undefined = loadProxyAgent();
const pacProxyAgentModule: any | undefined = loadPacProxyAgent();

function loadProxyAgent(): any | undefined {
  const moduleName = "@vscode/proxy-agent";
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

function loadPacProxyAgent(): any | undefined {
  const moduleName = "@vscode/proxy-agent";
  const appRoot = vscode.env.appRoot;
  try {
    return require(`${appRoot}/node_modules.asar/${moduleName}/out/agent.js`);
  } catch (err) {
    // Not in ASAR.
  }
  try {
    return require(`${appRoot}/node_modules/${moduleName}/out/agent.js`);
  } catch (err) {
    // Not available.
  }
  return undefined;
}

async function getProxyURL(targetUrl: string): Promise<string | undefined> {
  if (proxyAgentModule && proxyAgentModule.resolveProxyURL) {
    return await proxyAgentModule.resolveProxyURL(targetUrl);
  }
}

export async function createProxyAgent(proxy: string): Promise<any> {
  const resolver = () => {
    const parsed = URL.parse(proxy);
    if (parsed !== null) {
      if (parsed.protocol === "https:") {
        return `HTTPS ${parsed.hostname}:${parsed.port}`;
      } else {
        return `HTTP ${parsed.hostname}:${parsed.port}`;
      }
    }
  };

  const certs = await proxyAgentModule.loadSystemCertificates({ log: vsLogSink });

  if (pacProxyAgentModule && pacProxyAgentModule.createPacProxyAgent) {
    return pacProxyAgentModule.createPacProxyAgent(resolver, undefined, async (opts: unknown) => {
      (opts as any).ca = certs;
    });
  }
}

export async function getProxyEnv(
  backendUrl: string,
  apiUrl: string | undefined,
  config: Config,
  logger: Logger
): Promise<Record<string, string>> {
  const env: Record<string, string> = {};

  const proxy = await getProxyURL(backendUrl);
  if (proxy) {
    env["HTTPS_PROXY"] = proxy;
    env["HTTP_PROXY"] = proxy;
    logger.debug(`Set HTTPS_PROXY and HTTP_PROXY environment variables to: ${proxy}`);
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

const vsLogSink: VsLog = {
  trace: () => {},
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

interface VsLog {
  trace(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string | Error, ...args: any[]): void;
}
