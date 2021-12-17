import * as vscode from "vscode";

const KEY = "openapi-42crunch.imported-urls";
const MAX_SIZE = 100;

interface ImportedUrl {
  apiId: string;
  url: string;
}

export class ImportedUrlStore {
  constructor(private context: vscode.ExtensionContext) {}

  getUrl(apiId: string): string | undefined {
    const imported = this.context.globalState.get<ImportedUrl[]>(KEY);
    if (imported) {
      const found = imported.filter((entry) => entry.apiId === apiId);
      if (found.length > 0) {
        return found[0].url;
      }
    }
  }

  async setUrl(apiId: string, url: string): Promise<void> {
    const imported = this.context.globalState.get<ImportedUrl[]>(KEY) ?? [];
    const cleaned = imported.filter((entry) => entry.apiId !== apiId);
    cleaned.push({ apiId, url: url.toString() });
    if (cleaned.length > MAX_SIZE) {
      cleaned.shift();
    }
    await this.context.globalState.update(KEY, cleaned);
  }
}
