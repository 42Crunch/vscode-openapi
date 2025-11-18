/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Result } from "@xliic/result";

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry(
  fn: () => Promise<Result<"done" | "retry", unknown>>,
  {
    maxRetries,
    delay: retryDelay,
    maxDelay,
  }: { maxRetries: number; delay: number; maxDelay: number }
): Promise<Result<"done" | "exceeded", unknown>> {
  const factor = 1.5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const [result, error] = await fn();

    if (error !== undefined) {
      return [undefined, error];
    }

    if (result === "done") {
      return ["done", undefined];
    } else {
      const backoff = retryDelay * Math.pow(factor, attempt - 1);
      await delay(Math.min(backoff, maxDelay));
    }
  }

  return ["exceeded", undefined];
}
