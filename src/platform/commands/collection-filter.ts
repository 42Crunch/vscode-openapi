import * as vscode from "vscode";

import { PlatformStore } from "../stores/platform-store";
import { CollectionsProvider } from "../explorer/provider";
import { ExplorerNode } from "../nodes/base";
import { CollectionNode } from "../nodes/collection";
import { Cache } from "../../cache";
import { CollectionFilter } from "../types";

export default (
  store: PlatformStore,
  provider: CollectionsProvider,
  tree: vscode.TreeView<ExplorerNode>,
  cache: Cache
) => ({
  collectionsFilter: (collection: CollectionNode) =>
    collectionsFilter(store, provider, tree, cache, collection),
});

async function collectionsFilter(
  store: PlatformStore,
  provider: CollectionsProvider,
  tree: vscode.TreeView<ExplorerNode>,
  cache: Cache,
  collection: CollectionNode
) {
  const filter: CollectionFilter = { name: undefined, owner: "ALL" };

  /*
  const byName = "By Collection Name";
  const byOwner = "By Collection Owner";
  const types = await vscode.window.showQuickPick([byName, byOwner], {
    canPickMany: true,
  });

  const filter: CollectionFilter = { name: undefined, owner: "ALL" };

  if (types && types.includes(byOwner)) {
    const owner = await vscode.window.showQuickPick(["My Collections", "All Collections"]);
    if (owner[0] === "My Collections") {
      filter.owner = "OWNER";
    } else {
      filter.owner = "ALL";
    }
  }
  */

  //if (types && types.includes(byName)) {
  const name = await vscode.window.showInputBox({
    prompt: "Filter Collections by Name",
  });
  if (name && name !== "") {
    filter.name = name;
  } else {
    filter.name = undefined;
  }
  //}
  store.setCollectionsFilter(filter);
  provider.refresh();
}
