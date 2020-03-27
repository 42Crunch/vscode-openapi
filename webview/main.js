(function() {
  const vscode = acquireVsCodeApi();

  const focusLine = function(event) {
    vscode.postMessage({
      command: 'goToLine',
      uri: event.target.dataset.uri,
      line: event.target.dataset.lineNo,
    });
    event.preventDefault();
    event.stopPropagation();
  };

  const goFullReport = function(event) {
    vscode.postMessage({
      command: 'goFullReport',
      uri: event.target.dataset.uri,
    });
    event.preventDefault();
    event.stopPropagation();

  };

  setTimeout(() => {
    document.body.querySelector('h1').scrollIntoView({ behavior: 'auto', block: 'end' });
    document.body.querySelectorAll('.focus-line').forEach(element => element.addEventListener('click', focusLine));
    document.body.querySelector('.go-full-report').addEventListener('click', goFullReport);
  }, 10);
})();
