import * as Dialog from "@radix-ui/react-dialog";
import styled from "styled-components";

import { ThemeColorVariables } from "@xliic/common/theme";

import ButtonSecondary from "../../new-components/ButtonSecondary";
import Button from "../../new-components/Button";
import { useFeatureSelector, useFeatureDispatch, accept, reject } from "./slice";

export default function ConfirmationDialog() {
  const dispatch = useFeatureDispatch();
  const onAccept = () => dispatch(accept());
  const onReject = () => dispatch(reject());

  const { open, title, message } = useFeatureSelector((state) => state.confirmationDialog);

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Overlay />
        <DialogContent onEscapeKeyDown={onReject}>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{message}</Dialog.Description>
          <div style={{ display: "flex", marginTop: 25, justifyContent: "flex-end", gap: 4 }}>
            <ButtonSecondary onClick={onReject}>Cancel</ButtonSecondary>
            <Button onClick={onAccept}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const Overlay = styled(Dialog.Overlay)`
  background-color: var(${ThemeColorVariables.computedTwo});
  position: fixed;
  inset: 0;
`;

const DialogContent = styled(Dialog.Content)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 450px;
  max-height: 85vh;
  padding: 25px;
  background-color: var(${ThemeColorVariables.background});
  color: var(${ThemeColorVariables.foreground});
  border-radius: 6px;
  box-shadow: hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px;
`;
