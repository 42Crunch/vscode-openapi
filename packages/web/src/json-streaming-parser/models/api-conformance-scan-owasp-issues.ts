export enum SupportedOwaspTopTenIssueList {
  None,
  API1_2019,
  API2_2019,
  API3_2019,
  API4_2019,
  API5_2019,
  API6_2019,
  API7_2019,
  API8_2019,
  API9_2019,
  API10_2019,
  API1_2023,
  API2_2023,
  API3_2023,
  API4_2023,
  API5_2023,
  API6_2023,
  API7_2023,
  API8_2023,
  API9_2023,
  API10_2023
}

export interface OwaspByVersionMappingResponse<T> {
  [key: string]: T;
}

export interface OwaspIssueDetail {
  id: SupportedOwaspTopTenIssueList;
  shortName: string;
  version: string;
  longName: string;
}

export const owaspIssueDetailsKdb: OwaspIssueDetail[] = [
  {
    id: SupportedOwaspTopTenIssueList.None,
    shortName: 'None',
    version: '',
    longName: 'No OWASP issues found'
  },
  {
    id: SupportedOwaspTopTenIssueList.API1_2019,
    shortName: 'API1',
    version: '2019',
    longName: 'Broken Object Level Authorization'
  },
  {
    id: SupportedOwaspTopTenIssueList.API2_2019,
    shortName: 'API2',
    version: '2019',
    longName: 'Broken User Authentication'
  },
  {
    id: SupportedOwaspTopTenIssueList.API3_2019,
    shortName: 'API3',
    version: '2019',
    longName: 'Excessive Data Exposure'
  },
  {
    id: SupportedOwaspTopTenIssueList.API4_2019,
    shortName: 'API4',
    version: '2019',
    longName: 'Lack of Resources & Rate Limiting'
  },
  {
    id: SupportedOwaspTopTenIssueList.API5_2019,
    shortName: 'API5',
    version: '2019',
    longName: 'Broken Function Level Authorization'
  },
  {
    id: SupportedOwaspTopTenIssueList.API6_2019,
    shortName: 'API6',
    version: '2019',
    longName: 'Mass Assignment'
  },
  {
    id: SupportedOwaspTopTenIssueList.API7_2019,
    shortName: 'API7',
    version: '2019',
    longName: 'Security Misconfiguration'
  },
  {
    id: SupportedOwaspTopTenIssueList.API8_2019,
    shortName: 'API8',
    version: '2019',
    longName: 'Injection'
  },
  {
    id: SupportedOwaspTopTenIssueList.API9_2019,
    shortName: 'API9',
    version: '2019',
    longName: 'Improper Assets Management'
  },
  {
    id: SupportedOwaspTopTenIssueList.API10_2019,
    shortName: 'API10',
    version: '2019',
    longName: 'Insufficient Logging & Monitoring'
  },
  {
    id: SupportedOwaspTopTenIssueList.API1_2023,
    shortName: 'API1',
    version: '2023',
    longName: 'Broken Object Level Authorization'
  },
  {
    id: SupportedOwaspTopTenIssueList.API2_2023,
    shortName: 'API2',
    version: '2023',
    longName: 'Broken Authentication'
  },
  {
    id: SupportedOwaspTopTenIssueList.API3_2023,
    shortName: 'API3',
    version: '2023',
    longName: 'Broken Object Property Level Authorization'
  },
  {
    id: SupportedOwaspTopTenIssueList.API4_2023,
    shortName: 'API4',
    version: '2023',
    longName: 'Unrestricted Resource Consumption'
  },
  {
    id: SupportedOwaspTopTenIssueList.API5_2023,
    shortName: 'API5',
    version: '2023',
    longName: 'Broken Function Level Authorization'
  },
  {
    id: SupportedOwaspTopTenIssueList.API6_2023,
    shortName: 'API6',
    version: '2023',
    longName: 'Unrestricted Access to Sensitive Business Flows'
  },
  {
    id: SupportedOwaspTopTenIssueList.API7_2023,
    shortName: 'API7',
    version: '2023',
    longName: 'Server Side Request Forgery'
  },
  {
    id: SupportedOwaspTopTenIssueList.API8_2023,
    shortName: 'API8',
    version: '2023',
    longName: 'Security Misconfiguration'
  },
  {
    id: SupportedOwaspTopTenIssueList.API9_2023,
    shortName: 'API9',
    version: '2023',
    longName: 'Improper Inventory Management'
  },
  {
    id: SupportedOwaspTopTenIssueList.API10_2023,
    shortName: 'API10',
    version: '2023',
    longName: 'Unsafe Consumption of APIs'
  }
];
