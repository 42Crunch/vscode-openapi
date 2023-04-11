import styled from "styled-components";

import Input from "../../components/Input";
import Button from "../../components/Button";
import { useFeatureDispatch, testPlatformConnection } from "../../features/config/slice";

export default function PlatformConnection() {
  const dispatch = useFeatureDispatch();

  return (
    <Container>
      <h4 style={{ marginTop: 0 }}>Connection parameters</h4>
      <Input label="Platform URL" name="platformUrl" />
      <Input label="IDE token" name="platformApiToken" />
      <div>
        <Button
          onClick={(e) => {
            dispatch(testPlatformConnection());
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          Test connection
        </Button>
      </div>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-flow: column;
  gap: 8px;
`;
