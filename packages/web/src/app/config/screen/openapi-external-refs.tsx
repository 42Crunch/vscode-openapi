import {
    ConfigScreen,
    useFeatureSelector,
    useFeatureDispatch,
    saveConfig,
  } from "../../../features/config/slice";
import { ApprovedHostConfiguration } from "@xliic/common/config";
import { Title } from "../layout";
import { useState } from "react";
import { ThemeColorVariables } from "@xliic/common/theme";
import * as z from "zod";
import styled from "styled-components";
import { Eye } from "../../../icons"
import { useController, useFieldArray, useWatch } from "react-hook-form";
import Form from "../../../new-components/Form";
import { useAppDispatch, useAppSelector } from "../store";


type ApprovedHostConfigurationUpdate = {
  header?: string,
  prefix?: string,
  token?: string,
}


const columnPlaceholders: ApprovedHostConfiguration = {
  host: "",
  header: "Authorization",
  prefix: "Bearer",
  token: "Token",
}


function ExternalRefsHostsTable({ children }: { children: React.ReactNode }) {
  return <HostsTable>
    <colgroup>
      <col style={{width: "40%"}} />
      <col style={{width: "15%"}} />
      <col style={{width: "15%"}} />
      <col style={{width: "30%"}} />
    </colgroup>
    <thead>
      <tr>
        <th className="openapi-external-refs-host">Host</th>
        <th className="openapi-external-refs-header">Header</th>
        <th className="openapi-external-refs-prefix">Prefix</th>
        <th className="openapi-external-refs-token">Token</th>
      </tr>
    </thead>
    <tbody>
    { children || [] }
    </tbody>
  </HostsTable>;
}


type RowState = {
  readonly host: string;
  updateCount: number;
  revealToken: boolean;
};

type RowStateUpdate = {
  increaseUpdateCount?: boolean;
  toggleRevealToken?: boolean;
};


function OpenApiExternalRefs_old(): JSX.Element {
  const { data: { approvedHosts } } = useFeatureSelector((state) => state.config);
  const dispatch = useFeatureDispatch();

  const [ rows, setRows ] = useState<RowState[]>(
    () => approvedHosts.map( host => ({ host: host.host, updateCount: 0, revealToken: false }) ));

  if (rows.length != approvedHosts.length) {
    setRows(approvedHosts.map( host => {
      const matchingRow = rows.find(row => row.host == host.host);
      return matchingRow ?? ({ host: host.host, updateCount: 0, revealToken: false });
    })); //update row states
    return <></>;
  }

  const updateConfig = (updatedHosts: ApprovedHostConfiguration[]): void => {
    const newApprovedHosts: ApprovedHostConfiguration[] = updatedHosts
      .filter(row => !! row.host?.trim())
      .map(row => ({
        host: row.host!,
        header: row.header,
        prefix: row.prefix,
        token: row.token,
      }));
    dispatch( saveConfig({
      approvedHosts: newApprovedHosts
    }));
  }

  const updateRowState = (rowIndex: number, update: RowStateUpdate): void => {
    if (update.increaseUpdateCount || update.toggleRevealToken) {
      const oldRow = rows[rowIndex];
      const newRow: RowState = {
        ...oldRow,
        revealToken: update.toggleRevealToken ? ! oldRow.revealToken : oldRow.revealToken,
        updateCount: update.increaseUpdateCount ? oldRow.updateCount + 1 : oldRow.updateCount
      };
      setRows(rows.with(rowIndex, newRow));
    }
  };

  const updateHostConfig = (rowIndex: number, hostUpdate: ApprovedHostConfigurationUpdate): void => {
    const shouldUpdate = (Object.keys(hostUpdate) as [ keyof(ApprovedHostConfigurationUpdate) ])
      .filter(key => hostUpdate[key] !== undefined)
      .some(key => hostUpdate[key] != approvedHosts[rowIndex][key]);

    if (!shouldUpdate) {
      return;
    }

    const updatedHosts = approvedHosts.with(rowIndex, {
      ...approvedHosts[rowIndex],
      ...hostUpdate
    })

    updateConfig(updatedHosts);
    updateRowState(rowIndex, { increaseUpdateCount: true });
  };

  const generateKey = (rowIndex: number, rowData: RowState): string => {
    return `${rowIndex}/${approvedHosts[rowIndex].host}/${rowData.updateCount}/${rowData.revealToken}`;
  };

  return <>
    <Title>OpenAPI External References</Title>
    <SummaryContainer>
      Configure approved hosts and authorization for resolving external OpenAPI references.
    </SummaryContainer>
    <HostsTableContainer>
      <div>
        <ExternalRefsHostsTable>{
            rows.map((row, index) =>
              <tr key={generateKey(index, row)}>
                  <td className="openapi-external-refs-host">
                    <HostnameSpan>{approvedHosts[index].host}</HostnameSpan>
                  </td>
                  <td className="openapi-external-refs-header">
                    <HostInput type="text" name="header" placeholder={columnPlaceholders.header} defaultValue={approvedHosts[index].header}
                        onBlur={(e) => updateHostConfig(index, { header: e.target.value })} />
                  </td>
                  <td className="openapi-external-refs-prefix">
                    <HostInput type="text" name="prefix" placeholder={columnPlaceholders.prefix} defaultValue={approvedHosts[index].prefix}
                        onBlur={(e) => updateHostConfig(index, { prefix: e.target.value })} />
                  </td>
                  <td className="openapi-external-refs-token">
                    <TokenInputAndButtonContainer>
                      <HostInput type={row.revealToken ? "text" : "password"} name="token"
                          placeholder={columnPlaceholders.token}
                          defaultValue={approvedHosts[index].token}
                          onBlur={(e) => updateHostConfig(index, { token: e.target.value })} />
                      <RevealTokenInput type="button" name="reveal-token" title="Reveal token"
                          onClick={() => updateRowState(index, { toggleRevealToken: true })}>
                        <Eye />
                      </RevealTokenInput>
                    </TokenInputAndButtonContainer>
                  </td>
              </tr>
            )
        }</ExternalRefsHostsTable>
      </div>
    </HostsTableContainer>
  </>;
}


function FormInput(props: { name: string, [key: string]: any }): JSX.Element {
  const { name, children, ...additionalProps } = props;
  const { field } = useController({ name, });

  return <FormStyledInput {...additionalProps} {...field}>{children}</FormStyledInput>;
}

function HostnameDisplay({ name }: { name: string }): JSX.Element {
  const hostname = useWatch({ name });
  return <HostnameSpan>{ hostname }</HostnameSpan>
}


function OpenApiExternalRefsHostTableRow({ name }: { name: string }): JSX.Element {
  const [ showToken, setShowToken ] = useState(false);

  return <Row>
    <CellContainer>
      <HostnameDisplay name={`${name}.host`} />
    </CellContainer>
    <CellContainer>
      <FormInput type="text" name={`${name}.header`} placeholder={columnPlaceholders.header} />
    </CellContainer>
    <CellContainer>
      <FormInput type="text" name={`${name}.prefix`} placeholder={columnPlaceholders.prefix} />
    </CellContainer>
    <TokenCellContainer>
      <FormInput type={showToken ? "text" : "password"} name={`${name}.token`} placeholder={columnPlaceholders.token} />
      <RevealTokenInput type="button" title={`${showToken ? "Hide" : "Reveal"} token`}
          onClick={() => setShowToken(!showToken)}>
        <Eye />
      </RevealTokenInput>
    </TokenCellContainer>
  </Row>;
}


function OpenApiExternalRefsHostTable(): JSX.Element {
  const { fields } = useFieldArray({
    name: "approvedHosts",
  });

  return <Container>
    <Grid>
      <Header>
        <div className="openapi-external-refs-host">Host</div>
        <div className="openapi-external-refs-header">Header</div>
        <div className="openapi-external-refs-prefix">Prefix</div>
        <div className="openapi-external-refs-token">Token</div>
      </Header>
      <Fields>{
        fields.map((field, index) =>
          <OpenApiExternalRefsHostTableRow key={field.id} name={`approvedHosts.${index}`} />)
      }</Fields>
    </Grid>
  </Container>;
}


export function OpenApiExternalRefs(): JSX.Element {
  const approvedHosts = useAppSelector(state => state.config.data.approvedHosts);
  const dispatch = useAppDispatch();

  return <Form
      data={approvedHosts}
      saveData={approvedHosts => dispatch(saveConfig({ approvedHosts }))}
      wrapFormData={approvedHosts => ({ approvedHosts })}
      unwrapFormData={data => data.approvedHosts}
    >
      <OpenApiExternalRefsHostTable />
    </Form>;
}


/**
 * form styled components
 */
const Container = styled.div``;
const Grid = styled.div`
  display: grid;
  row-gap: 4px;
  grid-template-columns: 1fr 0.375fr 0.375fr 0.75fr;
`;
const Header = styled.div`
  display: contents;
  & > div {
    padding: 4px 8px;
    background-color: var(${ThemeColorVariables.computedOne});
    text-transform: uppercase;
    font-size: 90%;
    font-weight: 600;
  }
`;
const Fields = styled.div`
  display: contents;
  & > div > div {
    border-bottom: 1px solid var(${ThemeColorVariables.border});
  }
`;
const Row = styled.div`
  display: contents;
`;
const CellContainer = styled.div`
  padding: 4px 8px;
`;
const FormStyledInput = styled.input`
  height: 40px;
  background: transparent;
  line-height: 20px;
  border: none;
  padding: 0;
  color: var(${ThemeColorVariables.foreground});
  &::placeholder {
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
  &:focus {
    outline: none;
  }
`;
const TokenCellContainer = styled.div`
  padding: 4px 8px;
  display: flex;
  > input {
    flex: 1;
    margin-right: 4px;
  }
`;


/**
 * old table components
 */

const SummaryContainer = styled.div`
  margin-bottom: 32px;
`;

const HostsTableContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HostsTable = styled.table`
  table-layout: fixed;
  width: 100%;
  td {
    overflow: hidden;
  }
  td.openapi-external-refs-remove {
    text-align: center;
  }
  td > input {
    width: 100%;
  }
  th {
    overflow: hidden;
  }
`;

const HostnameSpan = styled.span`
  line-height: 40px;
`;

const HostInput = styled.input`
  height: 40px;
  background: transparent;
  line-height: 20px;
  border: none;
  padding: 0;
  color: var(${ThemeColorVariables.foreground});
  &::placeholder {
    color: var(${ThemeColorVariables.inputPlaceholderForeground});
  }
  &:focus {
    outline: none;
  }
`;

const TokenInputAndButtonContainer = styled.div`
  display: flex;
  > input {
    width: 100%;
  }
`;

const RevealTokenInput = styled.button`
  cursor: pointer;
  background: transparent;
  color: var(${ThemeColorVariables.foreground});
  border: 1px solid var(${ThemeColorVariables.buttonBorder});
  padding: 6px 0px;
  border-radius: 2px;
  width: 20px;
  &:focus {
    outline: 1px solid var(${ThemeColorVariables.focusBorder});
  }
  > svg {
    height: 14px;
    width: 14px;
    min-width: 14px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const schema = z.object({}).catchall(z.unknown());

const screen: ConfigScreen = {
    id: "openapi-external-refs",
    label: "External References",
    schema,
    form: OpenApiExternalRefs,
  };
export default screen;
