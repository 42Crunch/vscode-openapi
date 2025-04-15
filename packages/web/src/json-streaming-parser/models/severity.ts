export enum Severity {
  Critical = 5,
  High = 4,
  Medium = 3,
  Low = 2,
  Info = 1,
  None = 0
}

export interface SeverityDetail {
  id: Severity;
  label: string;
}

export const severityDetails: SeverityDetail[] = [
  {
    id: Severity.None,
    label: 'None'
  },
  {
    id: Severity.Info,
    label: 'Info'
  },
  {
    id: Severity.Low,
    label: 'Low'
  },
  {
    id: Severity.Medium,
    label: 'Medium'
  },
  {
    id: Severity.High,
    label: 'High'
  },
  {
    id: Severity.Critical,
    label: 'Critical'
  }
];
