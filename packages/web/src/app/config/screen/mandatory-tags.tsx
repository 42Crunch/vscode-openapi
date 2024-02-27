import * as z from "zod";

import { TagRegex } from "@xliic/common/platform";

import Textarea from "../../../components/Textarea";
import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";

export function MandatoryTags() {
  return (
    <>
      <Title>Mandatory Tags</Title>

      <p>
        42Crunch platform mandatory tags, these tags will be added to every API created on the
        platform.
      </p>
      <p>
        Tags are specified in the format <code>category:tag</code>, and multiple tags are separated
        by spaces or commas.
      </p>

      <Container>
        <Textarea label="Tags" name="platformMandatoryTags" />
      </Container>
    </>
  );
}

const schema = z
  .object({
    platformMandatoryTags: z
      .string()
      .regex(
        new RegExp(TagRegex),
        "Tags are invalid, must be a comma or space separated list of key:value pairs, e.g. env:dev app:myapp"
      ),
  })
  .catchall(z.unknown());

export default function screen(): ConfigScreen {
  return {
    id: "mandatory-tags",
    label: "Mandatory Tags",
    schema,
    form: MandatoryTags,
  };
}
