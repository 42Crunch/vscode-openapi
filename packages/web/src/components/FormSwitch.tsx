import styled from "styled-components";
import { ThemeColorVariables } from "@xliic/common/theme";
import { Controller } from "react-hook-form";
import Switch from "./Switch";

export default function FormSwitch({ name, label }: { name: string; label: string }) {
  return (
    <Container>
      <div>{label}</div>
      <Controller
        name={name}
        render={({ field }) => (
          <Switch value={field.value} onChange={(value) => field.onChange(value)} />
        )}
      />
    </Container>
  );
}

const Container = styled.div`
  height: 40px;
  background-color: var(${ThemeColorVariables.inputBackground});
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  padding: 4px 8px;
  gap: 4px;
  > div {
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
`;
