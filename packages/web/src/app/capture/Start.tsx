import styled from "styled-components";
import Button from "../../new-components/Button";
import { useAppDispatch, useAppSelector } from "./store";
import { browseFiles } from "./slice";

export default function Start() {
  const dispatch = useAppDispatch();

  return (
    <div>
      <h1>Welcome to the Capture App</h1>
      <p>This is the starting point for capturing API requests.</p>
      <Button
        onClick={(e) => {
          dispatch(browseFiles({ id: "", options: undefined }));
        }}
      >
        Upload
      </Button>
    </div>
  );
}
