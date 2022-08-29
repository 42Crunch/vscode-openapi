import styled from "styled-components";
import { HttpResponse } from "@xliic/common/http";
import Button from "react-bootstrap/Button";
import { createSchema } from "../../store/oasSlice";
import { useAppDispatch } from "../../store/hooks";
import { ThemeColorVariables } from "@xliic/common/theme";

export default function Tools({ response }: { response: HttpResponse }) {
  const dispatch = useAppDispatch();

  const isJson = isJsonResponse(response);

  return (
    <>
      <Container>
        <h4>Modify OpenAPI file based on the response contents</h4>
        <Entry aria-disabled={!isJson}>
          Use response contents to generate JSON Schema{" "}
          <Button
            disabled={!isJson}
            variant="secondary"
            size="sm"
            onClick={() => dispatch(createSchema({ response: JSON.parse(response.body!) }))}
          >
            Generate schema
          </Button>
        </Entry>
      </Container>
    </>
  );
}

const Container = styled.div`
  margin: 0 0.25rem;
`;

const Entry = styled.div.attrs((props: any) => ({
  color: props["aria-disabled"] ? `var(${ThemeColorVariables.disabledForeground})` : "inherit",
}))`
  color: ${(props) => props.color};
`;

function isJsonResponse(response: HttpResponse): boolean {
  for (const [name, value] of response.headers) {
    if (name.toLowerCase() === "content-type" && value.includes("json") && response.body !== "") {
      return true;
    }
  }
  return false;
}
