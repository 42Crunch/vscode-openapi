import {
    ConfigScreen,
    useFeatureSelector,
    useFeatureDispatch,
    saveConfig
  } from "../../../features/config/slice";
import { ApprovedHostConfiguration } from "../../../../../common/src/config";
import { Title } from "../layout";
import { useState } from "react";
import { ThemeColorVariables } from "@xliic/common/theme";
import * as z from "zod";
import styled from "styled-components";
import { Eye, TrashCan } from "../../../icons"


interface HostConfiguration {
  host?: string;
  header?: string;
  prefix?: string;
  token?: string;
}

const columnPlaceholders: HostConfiguration = {
  host: "Insert host, e.g. 'www.myhost.com'",
  header: "Authorization",
  prefix: "Bearer",
  token: "Token",
}


function ExternalRefsHostsTable({ children }: { children: React.ReactNode }) {
  return <HostsTable>
    <colgroup>
      <col style={{width: "30%"}} />
      <col style={{width: "15%"}} />
      <col style={{width: "15%"}} />
      <col style={{width: "30%"}} />
      <col style={{width: "10%"}} />
    </colgroup>
    <thead>
      <tr>
        <th className="openapi-external-refs-host">Host</th>
        <th className="openapi-external-refs-header">Header</th>
        <th className="openapi-external-refs-prefix">Prefix</th>
        <th className="openapi-external-refs-token">Token</th>
        <th className="openapi-external-refs-remove">Remove</th>
      </tr>
    </thead>
    <tbody>
    { children || [] }
    </tbody>
  </HostsTable>;
}


type RowData = {
  hostConfig: HostConfiguration;
  updateCount: number;
  revealToken: boolean;
};


export function OpenApiExternalRefs() {
  const { data: { approvedHosts } } = useFeatureSelector((state) => state.config);
  const dispatch = useFeatureDispatch();

  const [ rows, setRows ] = useState<RowData[]>(
    () => approvedHosts.map( host => ({ hostConfig: host, updateCount: 0, revealToken: false }) ));

  const addRow = () => {
    const rowsWithNewRow = rows.concat([ { hostConfig:{}, updateCount: 0, revealToken: false } ]);
    setRows(rowsWithNewRow);
  };

  const updateConfig = (newRows: RowData[]) => {
    const newApprovedHosts: ApprovedHostConfiguration[] = newRows
      .filter(row => !! row.hostConfig.host?.trim())
      .map(row => ({
        host: row.hostConfig.host!,
        header: row.hostConfig.header,
        prefix: row.hostConfig.prefix,
        token: row.hostConfig.token,
      }));
    dispatch( saveConfig({
      approvedHosts: newApprovedHosts
    }));
  }

  const updateRow = (rowIndex: number, updatedColumn: string, updatedValue: string) => {
    const oldRow = rows[rowIndex];
    const newRow: RowData = {
      ...oldRow,
      updateCount: oldRow.updateCount + 1,
      hostConfig: {
        ...oldRow.hostConfig,
        [updatedColumn]: updatedValue
      }
    };

    const updatedRows = rows.with(rowIndex, newRow);

    updateConfig(updatedRows);
    setRows(updatedRows);
  };

  const deleteRow = (rowIndex: number) => {
    const newRows = rows.concat();
    newRows.splice(rowIndex, 1);

    updateConfig(newRows);
    setRows(newRows);
  };

  const generateKey = (rowIndex: number, rowData: RowData) => {
    return `${rowIndex}/${rowData.updateCount}`;
  }

  return <>
    <Title>OpenAPI External References</Title>
    <SummaryContainer>
      Configure approved hosts and authorization for resolving external OpenAPI references.
    </SummaryContainer>
    <HostsTableContainer>
      <div>
        <ExternalRefsHostsTable>
          {
            rows.map((row, index) =>
              <tr key={generateKey(index, row)}>
                  <td className="openapi-external-refs-host">
                    <HostInput type="text" name="host" placeholder={columnPlaceholders.host} defaultValue={row.hostConfig.host}
                        onBlur={(e) => updateRow(index, "host", e.target.value)} />
                  </td>
                  <td className="openapi-external-refs-header">
                    <HostInput type="text" name="header" placeholder={columnPlaceholders.header} defaultValue={row.hostConfig.header}
                        onBlur={(e) => updateRow(index, "header", e.target.value)} />
                  </td>
                  <td className="openapi-external-refs-prefix">
                    <HostInput type="text" name="prefix" placeholder={columnPlaceholders.prefix} defaultValue={row.hostConfig.prefix}
                        onBlur={(e) => updateRow(index, "prefix", e.target.value)} />
                  </td>
                  <td className="openapi-external-refs-token">
                    <TokenInputAndButtonContainer>
                      <HostInput type={row.revealToken ? "text" : "password"} name="token"
                          placeholder={columnPlaceholders.token}
                          defaultValue={row.hostConfig.token}
                          onBlur={(e) => updateRow(index, "token", e.target.value)} />
                      <RevealTokenInput type="button" name="reveal-token" title="Reveal token"
                          onClick={() => setRows(rows.with(index, { ...row, revealToken: !row.revealToken }))}>
                        <Eye />
                      </RevealTokenInput>
                    </TokenInputAndButtonContainer>
                  </td>
                  <td className="openapi-external-refs-remove">
                    <RemoveAuthEntryButton type="button" name="remove" title="Remove entry"
                        onClick={(e) => deleteRow(index)}>
                      <TrashCan />
                    </RemoveAuthEntryButton>
                  </td>
              </tr>)
          }
        </ExternalRefsHostsTable>
      </div>
      <div>
        <AddEntryButton type="button" name="add-row" title="Add entry" value="Add..."
            onClick={addRow} />
      </div>
    </HostsTableContainer>
  </>;
}


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
  min-width: 20px;
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

const RemoveAuthEntryButton = styled.button`
  cursor: pointer;
  background: transparent;
  border: transparent;
  padding: 0px;
  color: var(${ThemeColorVariables.buttonForeground});
  width: 14px;
  height: 14px;
  &:focus {
    outline: 1px solid var(${ThemeColorVariables.focusBorder});
  }
  > svg {
    height: 14px;
    width: 14px;
    fill: var(${ThemeColorVariables.foreground});
  }
`;

const AddEntryButton = styled.input`
  cursor: pointer;
  width: 25%;
  background-color: var(${ThemeColorVariables.buttonBackground});
  color: var(${ThemeColorVariables.buttonForeground});
  border: 1px solid var(${ThemeColorVariables.buttonBorder});
  padding: 6px 16px;
  border-radius: 2px;
  &:focus {
    outline: 1px solid var(${ThemeColorVariables.focusBorder});
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
