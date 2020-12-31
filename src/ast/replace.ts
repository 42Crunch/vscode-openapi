import { parseJson } from "./json";
import { parseYaml } from "./yaml";

export type Range = [number, number]; // start, end

export interface Replacement {
  pointer: string;
  value: string;
  replaceKey?: boolean;
}

interface TextReplacement {
  range: Range;
  value: string;
}

function substrings(string: string, ranges: Range[]): string[] {
  const result: string[] = [];
  let position = 0;
  for (const [start, end] of ranges) {
    const before = string.substring(position, start);
    const inside = string.substring(start, end);
    position = end;
    result.push(before);
    result.push(inside);
  }
  result.push(string.substring(position));

  return result;
}

function replaceTextRanges(text: string, replacements: TextReplacement[]): string {
  const sorted = replacements.sort((a, b) => a.range[0] - b.range[0]);
  const ranges = sorted.map((replacement) => replacement.range);
  const chunks = substrings(text, ranges);

  for (let i = 0; i < sorted.length; i++) {
    let replacement = sorted[i].value;
    const target = i * 2 + 1;
    const original = chunks[target];
    let quote = "";
    if (original.startsWith(`"`) && original.endsWith(`"`)) {
      quote = `"`;
    } else if (original.startsWith(`'`) && original.endsWith(`'`)) {
      quote = `'`;
    }

    chunks[target] = `${quote}${replacement}${quote}`;
  }

  return chunks.join("");
}

export function replace(text: string, languageId: string, replacements: Replacement[]) {
  const [root, errors] = languageId === "yaml" ? parseYaml(text) : parseJson(text);
  if (errors.length) {
    throw new Error(`Unable to parse text to perform replacement in JSON/YAML in: ${text}`);
  }

  const textReplacements: TextReplacement[] = replacements.map((replacement) => {
    const target = root.find(replacement.pointer);
    const range = replacement.replaceKey ? target.getKeyRange() : target.getValueRange();
    return { range, value: replacement.value };
  });

  return replaceTextRanges(text, textReplacements);
}
