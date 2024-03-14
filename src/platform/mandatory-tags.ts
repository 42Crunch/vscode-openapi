import { TagRegex } from "@xliic/common/platform";
import { Configuration } from "../configuration";

export function getMandatoryTags(configuration: Configuration): string[] {
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
