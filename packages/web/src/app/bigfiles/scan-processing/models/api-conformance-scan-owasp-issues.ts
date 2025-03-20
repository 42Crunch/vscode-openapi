export enum ApiConformanceScanOwaspIssues {
  None,
  API1,
  API2,
  API3,
  API4,
  API5,
  API6,
  API7,
  API8,
  API9,
  API10
}

export interface OwaspIssueDetail {
  id: ApiConformanceScanOwaspIssues;
  shortName: string;
  version: string;
  longName: string;
}

export const owaspIssueDetails: OwaspIssueDetail[] = [
  {
    id: ApiConformanceScanOwaspIssues.None,
    shortName: 'None',
    version: '2019',
    longName: 'No OWASP issues found'
  },
  {
    id: ApiConformanceScanOwaspIssues.API1,
    shortName: 'API1',
    version: '2019',
    longName: 'Broken Object Level Authorization'
  },
  {
    id: ApiConformanceScanOwaspIssues.API2,
    shortName: 'API2',
    version: '2019',
    longName: 'Broken User Authentication'
  },
  {
    id: ApiConformanceScanOwaspIssues.API3,
    shortName: 'API3',
    version: '2019',
    longName: 'Excessive Data Exposure'
  },
  {
    id: ApiConformanceScanOwaspIssues.API4,
    shortName: 'API4',
    version: '2019',
    longName: 'Lack of Resources & Rate Limiting'
  },
  {
    id: ApiConformanceScanOwaspIssues.API5,
    shortName: 'API5',
    version: '2019',
    longName: 'Broken Function Level Authorization'
  },
  {
    id: ApiConformanceScanOwaspIssues.API6,
    shortName: 'API6',
    version: '2019',
    longName: 'Mass Assignment'
  },
  {
    id: ApiConformanceScanOwaspIssues.API7,
    shortName: 'API7',
    version: '2019',
    longName: 'Security Misconfiguration'
  },
  {
    id: ApiConformanceScanOwaspIssues.API8,
    shortName: 'API8',
    version: '2019',
    longName: 'Injection'
  },
  {
    id: ApiConformanceScanOwaspIssues.API9,
    shortName: 'API9',
    version: '2019',
    longName: 'Improper Assets Management'
  },
  {
    id: ApiConformanceScanOwaspIssues.API10,
    shortName: 'API10',
    version: '2019',
    longName: 'Insufficient Logging & Monitoring'
  }
];
