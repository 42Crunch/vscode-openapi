import * as z from "zod";

import { TagRegex } from "@xliic/common/platform";

import { ConfigScreen } from "../../../features/config/slice";
import { Container, Title } from "../layout";
import Textarea from "../../../new-components/fat-fields/Textarea";
import { useGetTagsQuery } from "../../../features/http-client/platform-api";
import { useGetSubscriptionQuery } from "../../../features/http-client/freemiumd-api";

export function MandatoryTags() {
  // Using a query hook automatically fetches data and returns query values
  //const { data, error, isLoading } = useGetTagsQuery("bulbasaur");
  const { data, error, isLoading } = useGetSubscriptionQuery(
    "CiAJIzvS9t4haZEfuTEdwkSmCyHI1nfsDQWP6TYU8SR+RxIYQKFQxVzU46oge4/bKRAhJQbL7EYLKleiGnzjTOQF6YT6Ri2rtO09Hf+0uTPZsU/aQ+p6vnBN+Yk1JbT0pDz/gw6EvuJkQZjpPC6CIQC5xPIz2d5iYmrD2Uzp4gRkZFDGNkOtO8ure56toeL0k9gG0qdlPvErsKQbUeLVsQpZuLwhkLlk7+6yp/4mKjTEy0wdYbWvFMrD"
  );

  return (
    <>
      <Title>Mandatory Tags</Title>

      {error ? <div>Error: {error.message}</div> : <div>Tags: {JSON.stringify(data)}</div>}

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

const schema = z.object({
  platformMandatoryTags: z
    .string()
    .regex(
      new RegExp(TagRegex),
      "Tags are invalid, must be a comma or space separated list of key:value pairs, e.g. env:dev app:myapp"
    ),
});

export default function screen(): ConfigScreen {
  return {
    id: "mandatory-tags",
    label: "Mandatory Tags",
    schema,
    form: MandatoryTags,
  };
}
