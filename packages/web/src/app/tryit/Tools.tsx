import styled from "styled-components";
import { HttpResponse } from "@xliic/common/http";
import { createSchema } from "./slice";
import { useAppDispatch } from "./store";
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              dispatch(createSchema({ response: JSON.parse(response.body!) }));
            }}
          >
            Generate schema
          </Button>
        </Entry>
      </Container>
    </>
  );
}

const Container = styled.div`
  padding: 8px;
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

const Button = styled.button`
  cursor: pointer;
  background-color: var(${ThemeColorVariables.buttonBackground});
  color: var(${ThemeColorVariables.buttonForeground});
  border: none;
  padding: 0.25rem 0.5rem;
  font-size: small;
`;
