import styled from "styled-components";
import Button from "../../new-components/Button";
import { useAppDispatch, useAppSelector } from "./store";
import { selectFiles } from "./slice";

export default function Start() {
  const dispatch = useAppDispatch();

  return (
    <div>
      <h1>Welcome to the Capture App</h1>
      <p>This is the starting point for capturing API requests.</p>
      <Button
        onClick={(e) => {
          dispatch(selectFiles({ id: undefined }));
        }}
      >
        Select files
      </Button>
    </div>
  );
}
