export async function parseScanV1(baseUrl: string, reportId: string, dbName: string): Promise<string> {
  return new Promise<string>(async (resolve, reject) => {
    if (typeof Worker !== 'undefined') {
      const worker: Worker = new Worker(new URL('./worker.ts', import.meta.url));
      worker.postMessage({ url: `${baseUrl}/api/v1/scanReports/${reportId}`, dbName });

      worker.onmessage = (message: MessageEvent) => {
        if (message.data.error) {
          reject(`Parsing error: ${message.data.error}`);
        } else {
          resolve('Parsing completed');
        }
      };

      // TODO SORT OUT ERROR RESPONSE
      worker.onerror = (err: ErrorEvent) => {
        reject(`Web worker error: ${err.error}`);
      };
    } else {
      reject('Web workers are not supported in this environment');
    }
  });
}
