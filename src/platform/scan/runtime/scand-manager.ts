import { Config } from "@xliic/common/config";
import { GeneralError } from "@xliic/common/error";
import { EnvStore } from "../../../envstore";
import * as managerApi from "../../api-scand-manager";
import { ScandManagerJobStatus } from "../../api-scand-manager";
import { Logger } from "../../types";
import { ScandManagerConnection } from "@xliic/common/scan";
import { EnvData, SimpleEnvironment } from "@xliic/common/env";

export async function runScanWithScandManager(
  envStore: EnvStore,
  scanEnv: SimpleEnvironment,
  config: Config,
  logger: Logger,
  token: string
): Promise<GeneralError | undefined> {
  logger.info(`Running API Conformance Scan using scand-manager`);

  const env: Record<string, string> = {};

  for (const [name, value] of Object.entries(scanEnv)) {
    env[name] = replaceEnvOld(value, await envStore.all());
  }

  let job: ScandManagerJobStatus | undefined = undefined;

  const services =
    config.platformServices.source === "auto"
      ? config.platformServices.auto
      : config.platformServices.manual;

  try {
    job = await managerApi.createJob(
      token,
      services!,
      config.scanImage,
      env,
      config.scandManager,
      logger
    );
  } catch (ex) {
    return {
      message: `Failed to create scand-manager job: ${ex}`,
    };
  }

  logger.info(`Created scand-manager job: "${job.name}"`);

  if (job.status === "failed") {
    // TODO introduce settings whether delete failed jobs or not
    return {
      message: `Failed to create scand-manager job "${job.name}", received unexpected status: ${job.status}`,
    };
  }

  const error = await waitForScandJob(job.name, config.scandManager, logger);

  if (error) {
    return error;
  }

  // job has completed, remove it
  await managerApi.deleteJobStatus(job.name, config.scandManager, logger);

  return undefined;
}

async function waitForScandJob(
  name: string,
  manager: ScandManagerConnection,
  logger: Logger
): Promise<GeneralError | undefined> {
  const maxDelay = manager.timeout * 1000;
  let currentDelay = 0;
  while (currentDelay < maxDelay) {
    const status = await managerApi.readJobStatus(name, manager, logger);
    // Status unknown may mean the job is not finished, keep waiting
    if (status.status === "succeeded") {
      return undefined;
    } else if (status.status === "failed") {
      const log = await managerApi.readJobLog(name, manager, logger);
      return { message: `Scand-manager job "${name}" has failed`, details: log };
    }
    logger.info(`Waiting for job: "${name}", status: "${status.status}"`);
    await delay(1000);
    currentDelay = currentDelay + 1000;
  }
  return { message: `Timed out waiting for scand-manager job "${name}" to finish` };
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function replaceEnvOld(value: string, env: EnvData): string {
  const ENV_VAR_REGEX = /{{([\w\-$]+)}}/;
  const SECRETS_PREFIX = "secrets.";
  return value.replace(ENV_VAR_REGEX, (match: string, name: string): string => {
    if (name.startsWith(SECRETS_PREFIX)) {
      const key = name.substring(SECRETS_PREFIX.length, name.length);
      return env.secrets.hasOwnProperty(key) ? (env.secrets[key] as string) : match;
    }
    return env.default.hasOwnProperty(name) ? (env.default[name] as string) : match;
  });
}
