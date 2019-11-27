(function() {
  const vscode = acquireVsCodeApi();

  const focusLine = function(event) {
    vscode.postMessage({
      command: 'goToLine',
      line: event.target.dataset.lineNo,
    });
    event.preventDefault();
    event.stopPropagation();
  };

  const goFullReport = function(event) {
    vscode.postMessage({
      command: 'goFullReport',
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
