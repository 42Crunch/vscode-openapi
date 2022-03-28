import * as React from 'react';
import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

declare var acquireVsCodeApi: any;

export const Preview = () => {
  const [oas, setOas] = useState(null);

  useEffect(() => {
    const vscode = acquireVsCodeApi();

    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.command) {
        case 'preview':
          const oas = JSON.parse(message.text);
          setOas(oas);
          break;
      }
    });
    vscode.postMessage({ command: 'init' });
  }, []);

  if (!oas) {
    return <p>Loading...</p>;
  }

  return <SwaggerUI spec={oas} />;
};
