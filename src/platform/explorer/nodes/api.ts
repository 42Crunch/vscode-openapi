import * as vscode from "vscode";
import { PlatformStore } from "../../stores/platform-store";
import { Api } from "../../types";
import { AbstractExplorerNode, ExplorerNode } from "./base";
import { CollectionNode } from "./collection";
import { FavoriteCollectionNode } from "./favorite";

export class ApiNode extends AbstractExplorerNode {
  constructor(
    parent: CollectionNode | FavoriteCollectionNode,
    private store: PlatformStore,
    readonly api: Api
  ) {
    super(
      parent,
      `${parent.id}-${api.desc.id}`,
      api.desc.name,
      vscode.TreeItemCollapsibleState.Collapsed
    );
    this.icon = "circuit-board";
    this.contextValue = "api";
  }

  async getChildren(): Promise<ExplorerNode[]> {
    const res = [];
    const apiId = this.getApiId();
    const apiTechName = this.getApiTechnicalName();
    const readonly = apiId !== apiTechName;
    if (readonly) {
      this.store.readonlyApis.add(apiId);
    }
    res.push(new OasNode(this, this.store, this.api, readonly));
    res.push(new AuditNode(this, this.store, this.api));
    return res;
  }

  getApiId(): string {
    return this.api.desc.id;
  }

  getApiTechnicalName(): string {
    return this.api.desc.technicalName;
  }

  getCollectionTechnicalName(): string {
    return (this.parent as CollectionNode).getCollectionTechnicalName();
  }
}

export class AuditNode extends AbstractExplorerNode {
  constructor(parent: ExplorerNode, private store: PlatformStore, private api: Api) {
    super(
      parent,
      `${parent.id}-audit}`,
      `Security Audit: ${score(api.assessment.grade)}`,
      vscode.TreeItemCollapsibleState.None
    );
    this.icon = api.assessment.isValid ? "verified" : "unverified";
    this.item.command = {
      command: "openapi.platform.openAuditReport",
      title: "",
      arguments: [api.desc.id],
    };
  }
}

export class OasNode extends AbstractExplorerNode {
  readonly icon: { dark: string; light: string } | string;

  constructor(
    parent: ExplorerNode,
    private store: PlatformStore,
    private api: Api,
    readonly?: boolean
  ) {
    super(
      parent,
      `${parent.id}-spec}`,
      "OpenAPI definition" + (readonly ? " (read only)" : ""),
      vscode.TreeItemCollapsibleState.None
    );
    this.icon = "code";
    this.item.command = {
      command: "openapi.platform.editApi",
      title: "",
      arguments: [api.desc.id],
    };
  }
}

function score(score: number): string {
  const rounded = Math.abs(Math.round(score));
  if (score === 0) {
    return "0";
  } else if (rounded >= 1) {
    return rounded.toString();
  }
  return "less than 1";
}
