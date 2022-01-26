import Header from "./Header";
import Summary from "./Summary";
import Footer from "./Footer";
import Issue from "./Issue";
import GoToFullReport from "./GoToFullReport";
import NoReport from "./NoReport";

import { useAppSelector, useAppDispatch } from "../hooks";
import { goToLine, copyIssueId, openLink } from "../hostActions";
import { goToFullReport } from "../reportSlice";
import Loading from "./Loading";

function App() {
  const kdb = useAppSelector((state) => state.kdb);
  const display = useAppSelector((state) => state.report.display);
  const issues = useAppSelector((state) => state.report.selected);
  const theme = useAppSelector((state) => state.theme);

  const dispatch = useAppDispatch();

  const hostGoToLine = (uri: string, line: number, pointer: string) =>
    dispatch(goToLine({ uri, line, pointer }));
  const hostCopyIssueId = (id: string) => dispatch(copyIssueId(id));
  const hostOpenLink = (href: string) => dispatch(openLink(href));

  const cssVars = [];
  if (theme.foreground !== undefined) {
    cssVars.push(`--audit-custom-foreground: ${theme.foreground};`);
  }
  if (theme.background !== undefined) {
    cssVars.push(`--audit-custom-background: ${theme.background};`);
  }
  const style = `:root { ${cssVars.join("\n")} }
   body {
     background-color: var(--audit-background);
     color: var(--audit-foreground);
     }
  `;

  return (
    <>
      <style>{style}</style>
      <div className={theme.kind === "dark" ? "vscode-dark" : ""}>
        {display !== "no-report" && <Header openLink={hostOpenLink} themeKind={theme.kind} />}
        {display === "full" && <Summary openLink={hostOpenLink} />}
        {display === "no-report" && <NoReport />}
        {display === "loading" && <Loading />}
        {issues.map((issue) => (
          <Issue
            kdb={kdb}
            issue={issue}
            key={issue.key}
            goToLine={hostGoToLine}
            copyIssueId={hostCopyIssueId}
            openLink={hostOpenLink}
          />
        ))}
        {display === "full" && issues.length === 0 && <h3>No issues found in this file</h3>}
        {display === "partial" && (
          <GoToFullReport goToFullReport={() => dispatch(goToFullReport())} />
        )}
        {display !== "no-report" && <Footer openLink={hostOpenLink} themeKind={theme.kind} />}
      </div>
    </>
  );
}

export default App;
