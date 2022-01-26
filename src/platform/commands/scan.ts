import * as vscode from "vscode";

export default () => ({
  async runCurl(command: string): Promise<void> {
    // TODO use own?
    const terminal = vscode.window.activeTerminal;
    terminal?.sendText(command);
    terminal?.show();
  },

  async runScan(token: string): Promise<void> {
    // TODO use own?
    token = "c7046e71-2b41-409e-b161-4f482977a713";
    const terminal = vscode.window.createTerminal({
      message: "running the scan",
      name: "scan",
      iconPath: { id: "checklist" },
    });

    terminal.sendText(
      `docker run --rm -e SCAN_TOKEN=${token} -e PLATFORM_SERVICE=services.dev.42crunch.com:8001 42crunch/scand-agent:latest`
    );
    //terminal.sendText("exit 3");

    terminal.show();

    /*
    vscode.window.onDidCloseTerminal((t) => {
      if (t === terminal && t.exitStatus && t.exitStatus.code) {
        vscode.window.showInformationMessage(`Exit code: ${t.exitStatus.code}`);
      }
    });
    */
  },
});
