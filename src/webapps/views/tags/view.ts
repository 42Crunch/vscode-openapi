/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import * as vscode from "vscode";

import { Webapp } from "@xliic/common/webapp/tags";
import { Configuration } from "../../../configuration";
import { WebView } from "../../web-view";
import { PlatformStore } from "../../../platform/stores/platform-store";
import { Logger } from "../../../platform/types";

import { HttpConfig, HttpError, HttpRequest } from "@xliic/common/http";
import { executeHttpRequestRaw } from "../../http-handler";
import { TagData, TagEntry, TAGS_DATA_KEY } from "@xliic/common/tags";
import { loadConfig } from "../../../util/config";

export class TagsWebView extends WebView<Webapp> {
  private uri: vscode.Uri | undefined;

  constructor(
    extensionPath: string,
    private memento: vscode.Memento,
    private configuration: Configuration,
    private secrets: vscode.SecretStorage,
    private platform: PlatformStore,
    private logger: Logger
  ) {
    super(extensionPath, "tags", "Tag Selection", vscode.ViewColumn.One);

    vscode.window.onDidChangeActiveColorTheme((e) => {
      if (this.isActive()) {
        this.sendColorTheme(e);
      }
    });
  }

  hostHandlers: Webapp["hostHandlers"] = {
    sendHttpRequest: async (payload: { id: string; request: HttpRequest; config: HttpConfig }) => {
      try {
        const response = await executeHttpRequestRaw(payload.request, payload.config);
        this.sendRequest({
          command: "showHttpResponse",
          payload: { id: payload.id, response },
        });
      } catch (e) {
        this.sendRequest({
          command: "showHttpError",
          payload: { id: payload.id, error: e as HttpError },
        });
      }
    },
    saveTags: async (data: TagData) => {
      const tagData = this.memento.get(TAGS_DATA_KEY, {}) as TagData;
      for (const [key, value] of Object.entries(data)) {
        if (value) {
          tagData[key] = value;
        } else {
          delete tagData[key];
        }
      }
      await this.memento.update(TAGS_DATA_KEY, tagData);
    },
  };

  async onStart() {
    await this.sendColorTheme(vscode.window.activeColorTheme);
    const config = await loadConfig(this.configuration, this.secrets);
    this.sendRequest({
      command: "loadConfig",
      payload: config,
    });
    const tagData = this.memento.get(TAGS_DATA_KEY, {}) as TagData;
    const targetFileName = this.uri?.fsPath;
    if (targetFileName) {
      if (!tagData[targetFileName]) {
        tagData[targetFileName] = [] as TagEntry[];
      }
      this.sendRequest({
        command: "loadTags",
        payload: { targetFileName, data: tagData },
      });
    }
  }

  async showTagsWebView(uri: vscode.Uri) {
    this.uri = uri;
    await this.show();
  }
}
