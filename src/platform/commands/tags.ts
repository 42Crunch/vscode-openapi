import * as vscode from "vscode";

import { PlatformStore } from "../stores/platform-store";
import { getApiConfig, makeApiConfig, saveApiConfig } from "../config";
import { Configuration } from "../../configuration";
import { Cache } from "../../cache";
import { Tag, TagAndSqg } from "../types";
import { getMandatoryTags } from "../mandatory-tags";

export default (cache: Cache, store: PlatformStore, confiuration: Configuration) => ({
  updateTags: async (document: vscode.TextDocument) => {
    const quickPick = vscode.window.createQuickPick<TagItemOrSeparator>();
    quickPick.canSelectMany = true;
    quickPick.busy = true;
    quickPick.enabled = false;
    quickPick.matchOnDescription = true;
    quickPick.title = "42Crunch platform tags";
    quickPick.placeholder = "Loading tags...";
    quickPick.show();

    const tags = await store.getTags();
    const mandatoryTags = getMandatoryTags(confiuration);
    const items = getQuickpickItems(tags, mandatoryTags);
    const currentTags = (await getApiConfig(document.uri))?.tags || [];

    quickPick.items = items;
    quickPick.selectedItems = items.filter(
      (item) =>
        item.kind === vscode.QuickPickItemKind.Default &&
        !item.onlyAdminCanTag &&
        (item?.isMandatory || currentTags.includes(item.label))
    );
    quickPick.placeholder = "";
    quickPick.busy = false;
    quickPick.enabled = true;

    let previous: string[] = quickPick.selectedItems
      .filter((item) => item.kind === vscode.QuickPickItemKind.Default)
      .map((item) => item.label);

    quickPick.onDidChangeSelection((selection) => {
      const changed =
        previous.length !== selection.length ||
        !previous.every((item) => selection.some((selected) => selected.label === item));

      if (changed) {
        quickPick.selectedItems = updateSelection(items, selection as TagItem[], previous);
        previous = quickPick.selectedItems
          .filter((item) => item.kind === vscode.QuickPickItemKind.Default)
          .map((item) => item.label);
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
        .filter((item) => item.kind === vscode.QuickPickItemKind.Default && !item.isMandatory)
        .map((item) => item.kind === vscode.QuickPickItemKind.Default && item.label)
        .filter((item) => item !== false) as string[];
      await saveApiConfig(document.uri, config);
      quickPick.hide();
    });
  },
});

function getQuickpickItems(tags: TagAndSqg[], mandatoryTags: string[]): TagItemOrSeparator[] {
  const grouped = groupBy(tags, "categoryName");
  const items: TagItemOrSeparator[] = [];
  // sort keys of the grouped object and iterate over each one with for of loop
  for (const key of Object.keys(grouped).sort()) {
    const groupTags = grouped[key];
    groupTags.sort((a, b) => a.tagName.localeCompare(b.tagName));
    const label = groupTags[0].isExclusive ? "single tag only" : `multiple tags allowed`;
    items.push({ label, kind: vscode.QuickPickItemKind.Separator });
    for (const tag of groupTags) {
      const label = `${tag.categoryName}:${tag.tagName}`;
      const isMandatory = mandatoryTags.includes(label);
      items.push({
        kind: vscode.QuickPickItemKind.Default,
        label,
        categoryName: tag.categoryName,
        isExclusive: tag.isExclusive,
        detail: formatSqgDetail(tag),
        onlyAdminCanTag: !!tag.onlyAdminCanTag,
        isMandatory,
        description: tag.onlyAdminCanTag ? "(admin only)" : isMandatory ? "(mandatory)" : undefined,
      });
    }
  }
  return items;
}

// returns a new selection taking tag exclusivity and mandatory tags into consideration
function updateSelection(
  items: TagItemOrSeparator[],
  selection: readonly TagItem[],
  previous: string[]
): TagItem[] {
  // newly selected items
  const fresh = selection.filter((item) => !previous.includes(item.label));
  return items.filter((item) => {
    // separators not selectable
    if (item.kind === vscode.QuickPickItemKind.Separator) {
      return false;
    }

    // admin only tags are not selectable either
    if (item.onlyAdminCanTag) {
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
  }) as TagItem[];
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
  kind: vscode.QuickPickItemKind.Default;
  categoryName: string;
  isExclusive: boolean;
  isMandatory: boolean;
  onlyAdminCanTag: boolean;
};

type TagItemOrSeparator =
  | TagItem
  | {
      kind: vscode.QuickPickItemKind.Separator;
      label: string;
    };

function isSelected(item: TagItem, selection: readonly TagItem[]): boolean {
  return selection.some((selected) => selected.label === item.label);
}

function formatSqgDetail(tag: TagAndSqg): string | undefined {
  if (tag.auditSqgName && tag.scanSqgName) {
    return `Audit SQG: ${tag.auditSqgName}, Scan SQG: ${tag.scanSqgName}`;
  } else if (tag.auditSqgName) {
    return `Audit SQG: ${tag.auditSqgName}`;
  } else if (tag.scanSqgName) {
    return `Scan SQG: ${tag.scanSqgName}`;
  }
}
