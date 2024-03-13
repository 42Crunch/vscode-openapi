import * as vscode from "vscode";

import { PlatformStore } from "../stores/platform-store";
import { getApiConfig, makeApiConfig, saveApiConfig } from "../config";
import { Configuration } from "../../configuration";
import { TagRegex } from "@xliic/common/platform";
import { Cache } from "../../cache";
import { Tag } from "../types";

export default (cache: Cache, store: PlatformStore, confiuration: Configuration) => ({
  updateTags: async (document: vscode.TextDocument) => {
    const quickPick = vscode.window.createQuickPick<TagItem>();
    quickPick.canSelectMany = true;
    quickPick.busy = true;
    quickPick.enabled = false;
    quickPick.title = "42Crunch platform tags";
    quickPick.placeholder = "Loading tags...";
    quickPick.show();

    const tags = await store.getTags();
    const mandatoryTags = getMandatoryTags(confiuration);
    const items = getQuickpickItems(tags, mandatoryTags);
    const currentTags = (await getApiConfig(document.uri))?.tags || [];

    quickPick.items = items;
    quickPick.selectedItems = items.filter(
      (item) => currentTags.includes(item.label) || item?.isMandatory
    );
    quickPick.placeholder = "";
    quickPick.busy = false;
    quickPick.enabled = true;

    let previous: string[] = quickPick.selectedItems.map((item) => item.label);
    quickPick.onDidChangeSelection((selection) => {
      const changed =
        previous.length !== selection.length ||
        !previous.every((item) => selection.some((selected) => selected.label === item));

      if (changed) {
        quickPick.selectedItems = updateSelection(items, selection, previous);
        previous = quickPick.selectedItems.map((item) => item.label);
      }
    });

    quickPick.onDidAccept(async (e) => {
      let config = await getApiConfig(document.uri);
      if (config === undefined) {
        const parsed = cache.getParsedDocument(document);
        const title = (parsed as any)?.value?.info?.title || "OpenAPI";
        config = await makeApiConfig(document.uri, title);
      }
      config.tags = quickPick.selectedItems
        .filter((item) => !item.isMandatory)
        .map((item) => item.label);
      await saveApiConfig(document.uri, config);
      quickPick.hide();
    });
  },
});

function getQuickpickItems(tags: Tag[], mandatoryTags: string[]) {
  const grouped = groupBy(tags, "categoryName");
  const items: any[] = [];
  // sort keys of the grouped object and iterate over each one with for of loop
  for (const key of Object.keys(grouped).sort()) {
    const groupTags = grouped[key];
    groupTags.sort((a, b) => a.tagName.localeCompare(b.tagName));
    const label = groupTags[0].isExclusive ? "" : `multiple tags allowed`;
    items.push({ label, kind: vscode.QuickPickItemKind.Separator });
    for (const tag of groupTags) {
      const label = `${tag.categoryName}:${tag.tagName}`;
      const isMandatory = mandatoryTags.includes(label);
      items.push({
        label,
        categoryName: tag.categoryName,
        isExclusive: tag.isExclusive,
        detail: tag.tagDescription,
        isMandatory,
        description: isMandatory ? "(mandatory)" : undefined,
      });
    }
  }
  return items;
}

// returns a new selection taking tag exclusivity and mandatory tags into consideration
function updateSelection(
  items: any[],
  selection: readonly TagItem[],
  previous: string[]
): TagItem[] {
  // newly selected items
  const fresh = selection.filter((item) => !previous.includes(item.label));
  return items.filter((item) => {
    // separators
    if (item.kind === vscode.QuickPickItemKind.Separator) {
      return false;
    }

    // mandatory items
    if (item.isMandatory) {
      return true;
    }

    // non exclusive items
    if (!item.isExclusive) {
      return isSelected(item, selection);
    }

    // in fresh and had different category to any mandatory item
    if (
      fresh.some((selected) => selected.label === item.label) &&
      !selection.some(
        (selected) => selected.categoryName === item.categoryName && selected.isMandatory
      )
    ) {
      return isSelected(item, selection);
    }

    // exclusive items with a different category to any other item in fresh
    if (fresh.every((selected) => selected.categoryName !== item.categoryName)) {
      return isSelected(item, selection);
    }
  });
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, currentItem) => {
    const groupKey = currentItem[key];

    if (!(result as any)[groupKey]) {
      (result as any)[groupKey] = [];
    }

    (result as any)[groupKey].push(currentItem);
    return result;
  }, {});
}

type TagItem = vscode.QuickPickItem & {
  categoryName: string;
  isExclusive: boolean;
  isMandatory?: boolean;
};

function isSelected(item: TagItem, selection: readonly TagItem[]): boolean {
  return selection.some((selected) => selected.label === item.label);
}

function getMandatoryTags(configuration: Configuration): string[] {
  const tags: string[] = [];
  const platformMandatoryTags = configuration.get<string>("platformMandatoryTags");
  if (platformMandatoryTags !== "") {
    if (platformMandatoryTags.match(TagRegex) !== null) {
      for (const tag of platformMandatoryTags.split(/[\s,]+/)) {
        if (tag !== "") {
          tags.push(tag);
        }
      }
    }
  }
  return tags;
}
