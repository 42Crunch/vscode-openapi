(function () {
  const vscode = acquireVsCodeApi();

  const focusLine = function (event) {
    vscode.postMessage({
      command: 'goToLine',
      uri: event.target.dataset.uri,
      line: event.target.dataset.lineNo,
    });
    event.preventDefault();
    event.stopPropagation();
  };

  const copyIssueId = function (event) {
    vscode.postMessage({
      command: 'copyIssueId',
      id: event.target.dataset.issueId,
    });
    event.preventDefault();
    event.stopPropagation();
  };

  const goFullReport = function (event) {
    vscode.postMessage({
      command: 'goFullReport',
      uri: event.target.dataset.uri,
    });
    event.preventDefault();
    event.stopPropagation();
  };

  setTimeout(() => {
    document.body.querySelector('h1').scrollIntoView({ behavior: 'auto', block: 'end' });
    document.body.querySelectorAll('.focus-line').forEach((e) => e.addEventListener('click', focusLine));
    // there is only one .go-full-report on the page, but doing querySelectorAll() makes it easier to
    // handle case where there is no element on the page
    document.body.querySelectorAll('.go-full-report').forEach((e) => e.addEventListener('click', goFullReport));
    document.body.querySelectorAll('.issue-id').forEach((e) => e.addEventListener('click', copyIssueId));
  }, 10);
})();
