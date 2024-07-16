import styled from "styled-components";
import * as ReactCheckbox from "@radix-ui/react-checkbox";
import { Check } from "../../icons";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { ThemeColorVariables } from "@xliic/common/theme";
import {
  requestAnondTokenByEmail,
  useFeatureDispatch,
  useFeatureSelector,
  saveAnondEmail,
  saveAnondToken,
  resetAnondTokenRequestResult,
  anondSignUpComplete,
  platformSignUpComplete,
  savePlatformCredentials,
  saveAgreeToTermsAndConditions,
  openLink,
} from "./slice";
import * as z from "zod";
import { NormalProgressButton } from "../../new-components/ProgressButton";
import Form from "../../new-components/Form";
import Input from "../../components/Input";
import { PlatformCredentials } from "@xliic/common/signup";
import { ErrorBanner } from "../../components/Banner";
import Textarea from "../../new-components/fat-fields/Textarea";

enum FormIDs {
  BasicSignUpForm = 'BasicSignUpForm',
  PlatformSignUpForm = 'PlatformSignUpForm',
  AnondSignUpEmailForm = 'AnondSignUpEmailForm',
  AnondSignUpTokenForm = 'AnondSignUpTokenForm',
}

const doNothingWrapper = (data: any) => { return data };

export default function BasicSignUpForm() {

  const dispatch = useFeatureDispatch();
  const {agreeToTermsAndConditions, platformCredentials, anondCredentials, anondTokenRequestResult} = useFeatureSelector((state) => state.signup);
  const [formId, setCurrentFormId] = useState<FormIDs>(FormIDs.BasicSignUpForm);

  if (formId === FormIDs.AnondSignUpEmailForm && anondTokenRequestResult?.success) {
    setCurrentFormId(FormIDs.AnondSignUpTokenForm);
  }
  return (
    <>
      {formId === FormIDs.BasicSignUpForm && (
        <Container>
          <Title>42Crunch Audit runs 300+ checks for security best practices in your API. Use your existing platform credentials or provide an email to receive a freemium token.</Title>
          <AgreeToTermsAndConditionsCheckbox/>
          <ButtonsBar>
            <NormalProgressButton
              label="I have an existing 42Crunch Platform account"
              disabled={!agreeToTermsAndConditions}
              waiting={false}
              onClick={(e) => {
                setCurrentFormId(FormIDs.PlatformSignUpForm);
                e.preventDefault();
                e.stopPropagation();
              }}
            />
            <NormalProgressButton
              label="I'm a new user, please email me the token"
              disabled={!agreeToTermsAndConditions}
              waiting={false}
              onClick={(e) => {
                setCurrentFormId(FormIDs.AnondSignUpEmailForm);
                e.preventDefault();
                e.stopPropagation();
              }}
            />
          </ButtonsBar>
        </Container>
      )}
      {formId === FormIDs.PlatformSignUpForm && (
        <PlatformSignUpForm data={platformCredentials} backToPrevForm={() =>
          setCurrentFormId(FormIDs.BasicSignUpForm)
        }/>
      )}
      {formId === FormIDs.AnondSignUpEmailForm && (         
        <AnondSignUpEmailForm data={{email: anondCredentials.email}} backToPrevForm={() =>
          setCurrentFormId(FormIDs.BasicSignUpForm)
        }/>
      )}
      {formId === FormIDs.AnondSignUpTokenForm && (         
        <AnondSignUpTokenForm data={{anondToken: anondCredentials.anondToken}} backToPrevForm={() => {
            dispatch(resetAnondTokenRequestResult());            
            setCurrentFormId(FormIDs.AnondSignUpEmailForm);
          }
        }/>
      )}
  </>
  );
}

function AnondSignUpEmailForm({data, backToPrevForm}: {data: {email: string}, backToPrevForm: () => void}) {
  const dispatch = useFeatureDispatch();
  const {anondTokenRequestResult, waitingForAnondToken, complete } = useFeatureSelector((state) => state.signup);
  const schema = z.object({
    email: z.string().min(1, { message: "This field has to be filled." }).email("This is not a valid email.")
  });
  return (
    <Form
      data={data}
      saveData={(data) => dispatch(saveAnondEmail(data.email))}
      wrapFormData={doNothingWrapper}
      unwrapFormData={doNothingWrapper}
      schema={schema}
      useFormMode={"onChange"}
    >
      <Container>
      <Title>Enter your email to receive the token</Title>
        <InputContainer>
          <Input label="Email" name="email" disabled={complete} />
          {anondTokenRequestResult && !anondTokenRequestResult.success && (
            <ErrorBanner message="Unexpected error when trying to request token">{anondTokenRequestResult.message}</ErrorBanner>
          )}
        </InputContainer>
        <ButtonsBar>
          <ButtonBack disabled={complete || waitingForAnondToken} backToPrevForm={backToPrevForm} />
          <ButtonSendEmail/>
        </ButtonsBar>
      </Container>
    </Form>
  );
}

function ButtonBack({disabled, backToPrevForm}: {disabled: boolean, backToPrevForm: () => void}) {
  return (
    <NormalProgressButton
      label="Back"
      disabled={disabled}
      waiting={false}
      onClick={(e) => {
        backToPrevForm();
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
}

function ButtonSendEmail() {
  const dispatch = useFeatureDispatch();
  const {waitingForAnondToken, complete } = useFeatureSelector((state) => state.signup);
  const email = useWatch({ name: "email" });
  const { formState: { isValid } } = useFormContext();
  return (
    <NormalProgressButton
      label="Request token"
      disabled={complete || !isValid}
      waiting={waitingForAnondToken}
      onClick={(e) => {
        dispatch(requestAnondTokenByEmail(email));
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
}

function AnondSignUpTokenForm({data, backToPrevForm}: {data: {anondToken: string}, backToPrevForm: () => void}) {
  const dispatch = useFeatureDispatch();
  const {complete } = useFeatureSelector((state) => state.signup);
  const schema = z.object({
    anondToken: z.string().min(1, { message: "This field has to be filled." })
  });
  return (
    <Form
      data={data}
      saveData={(data) => dispatch(saveAnondToken(data.anondToken))}
      wrapFormData={doNothingWrapper}
      unwrapFormData={doNothingWrapper}
      schema={schema}
      useFormMode={"onChange"}
    >
      <Container>
        <Title>The token has been sent. If you don't get the mail within a couple minutes, check your spam folder and that the address is correct. Paste the token above.</Title>
        <InputContainer> 
          <Textarea label="Freemium token" name="anondToken" disabled={complete} />
        </InputContainer>
        <ButtonsBar>
          <ButtonBack disabled={complete} backToPrevForm={backToPrevForm} />
          <ButtonSaveAnondToken/>
        </ButtonsBar>
      </Container>
    </Form>
  );
}

function ButtonSaveAnondToken() {
  const dispatch = useFeatureDispatch();
  const {anondCredentials, waitingForAnondToken: waitingForToken, complete } = useFeatureSelector((state) => state.signup);
  const anondToken = useWatch({ name: "anondToken" });
  const { formState: { isValid } } = useFormContext();
  return (
    <NormalProgressButton
      label="Save"
      disabled={complete || !isValid}
      waiting={false}
      onClick={(e) => {
        dispatch(anondSignUpComplete({email: anondCredentials.email, anondToken}));
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
}

function PlatformSignUpForm({data, backToPrevForm}: {data: PlatformCredentials, backToPrevForm: () => void}) {
  const dispatch = useFeatureDispatch();
  const {platformConnectionTestResult, complete } = useFeatureSelector((state) => state.signup);
  const schema = z.object({
    platformUrl: z.string().url().startsWith("https://"),
    platformApiToken: z
      .string()
      .regex(
        /^(ide_|api_)?[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        "Token is invalid"
      ),
  });
  return (
    <Form
      data={data}
      saveData={(data) => dispatch(savePlatformCredentials(data))}
      wrapFormData={doNothingWrapper}
      unwrapFormData={doNothingWrapper}
      schema={schema}
      useFormMode={"onChange"}
    >
      <Container>
        <Title>Please enter 42Crunch Platform credentials</Title>
        <InputContainer>
          <Input label="Platform URL" name="platformUrl" disabled={complete} />
          <Input label="IDE token" name="platformApiToken" disabled={complete} password />
          {platformConnectionTestResult && (
          <ErrorBanner message="Failed to connect">{platformConnectionTestResult.error}</ErrorBanner>
        )}
        </InputContainer>
        <ButtonsBar>
          <ButtonBack disabled={complete} backToPrevForm={backToPrevForm} />
          <ButtonSavePlatformCredentials/>
        </ButtonsBar>
      </Container>
    </Form>
  );
}

function ButtonSavePlatformCredentials() {
  const dispatch = useFeatureDispatch();
  const { waitingForPlatformConnectionTest, complete } = useFeatureSelector((state) => state.signup);
  const platformUrl = useWatch({ name: "platformUrl" });
  const platformApiToken = useWatch({ name: "platformApiToken" });
  const { formState: { isValid } } = useFormContext();
  return (
    <NormalProgressButton
      label="Save"
      disabled={complete || !isValid}
      waiting={waitingForPlatformConnectionTest}
      onClick={(e) => {
        dispatch(platformSignUpComplete({platformUrl, platformApiToken}));
        e.preventDefault();
        e.stopPropagation();
      }}
    />
  );
}

export function wrapStub(data: any) {
  console.info("wrapStub = " + data);
  return data;
}

export function unwrapStub(data: any): any {
  console.info("unwrapStub = " + data);
  return data;
}

export function AgreeToTermsAndConditionsCheckbox() {
  const dispatch = useFeatureDispatch();
  const { agreeToTermsAndConditions } = useFeatureSelector((state) => state.signup);
  return (
    <AgreeToTermsAndConditionsBar>
      <CheckboxRoot
        checked={agreeToTermsAndConditions}
        onCheckedChange={(checked: boolean) => { 
          dispatch(saveAgreeToTermsAndConditions(checked));
         }}
      >
      <Indicator>
        <Check />
      </Indicator>
      </CheckboxRoot>
      By clicking checkbox you agree to our
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          dispatch(openLink("https://42crunch.com"));
        }}
      >
        terms & conditions
      </a>
    </AgreeToTermsAndConditionsBar>
  );
}

const Title = styled.div`
  font-weight: 700;
  margin-bottom: 16px;
`;

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  padding: 16px;
`;

const InputContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 6px;
  max-width: 560px;
  margin-bottom: 6px;
`;

const ButtonsBar = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const AgreeToTermsAndConditionsBar = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
  margin-bottom: 16px;
`;

const CheckboxRoot = styled(ReactCheckbox.Root)`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(${ThemeColorVariables.checkboxBackground});
  border-radius: 4px;
  border-color: var(${ThemeColorVariables.checkboxBorder});
  border-width: 1px;
  border-style: solid;
`;

const Indicator = styled(ReactCheckbox.Indicator)`
  display: flex;
  align-items: center;
  justify-content: center;
  fill: var(${ThemeColorVariables.checkboxForeground});
`;
