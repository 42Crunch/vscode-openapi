import {
  createSlice,
  PayloadAction,
  Dispatch,
  StateFromReducersMapObject,
  Draft,
} from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

import {
  Audit,
  Issue,
  CriticalityLevel,
  Criticality,
  IssuesByDocument,
  FilesMap,
  Domain,
  SeverityLevel,
  CriticalityLevelId,
  SeverityLevels,
} from "@xliic/common/audit";

export type KdbArticle = {
  group: string;
  subgroup: string;
  title: {
    text: string;
  };
};

export interface Kdb {
  [key: string]: KdbArticle;
}

export type Filter = {
  severity?: SeverityLevel;
  rule?: string;
  domain?: Domain;
  group?: string;
  ids?: number[];
};

export interface ReportState {
  tab: "priority" | "issues";
  audit: Audit;
  filter: Filter;
  issues: FlatIssue[];
  filtered: FlatIssue[];
  kdb: Kdb;
  stats: Stats;
  issueTitles: { value: string; label: string }[];
  sqgTodo: boolean;
}

export type FlatIssue = Issue & {
  filename: string;
  domain: string;
  group: string;
};

export type IssueStats = {
  id: string;
  kdb: KdbArticle;
  title: string;
  score: number;
  displayScore: string;
  count: number;
  important: boolean;
  criticality: CriticalityLevel;
};

export type SeverityStats = Record<SeverityLevel, number>;

export type GroupStats = {
  oasconformance: {
    validation: SeverityStats;
    semantics: SeverityStats;
    bestpractices: SeverityStats;
  };
  datavalidation: {
    parameters: SeverityStats;
    paths: SeverityStats;
    schema: SeverityStats;
    responseheader: SeverityStats;
    responsedefinition: SeverityStats;
  };
  security: {
    authentication: SeverityStats;
    authorization: SeverityStats;
    transport: SeverityStats;
  };
};

export type Stats = {
  byIssue: IssueStats[];
  byGroup: GroupStats;
};

const initialState: ReportState = {
  audit: {
    filename: "",
    files: {},
    issues: {},
    minimalReport: false,
    valid: true,
    openapiState: "",
    summary: {
      documentUri: "",
      subdocumentUris: [],
      errors: false,
      invalid: false,
      all: 0,
      datavalidation: { max: 0, value: 0 },
      security: { max: 0, value: 0 },
      oasconformance: { max: 0, value: 0 },
    },
  },
  tab: "priority",
  issues: [],
  filtered: [],
  stats: {
    byIssue: [],
    byGroup: getStatsByGroup([]),
  },
  kdb: {},
  issueTitles: [],
  filter: {},
  sqgTodo: false,
};

export const slice = createSlice({
  name: "audit",
  initialState,
  reducers: {
    startAudit: (state, action: PayloadAction<undefined>) => {},
    cancelAudit: (state, action: PayloadAction<undefined>) => {},
    showFullReport: (state, { payload: audit }: PayloadAction<Audit>) => {
      if (state.audit.filename !== audit.filename) {
        // reset filter, sqg todo if showing report for a different file than the one
        // currently displayed
        state.tab = "priority";
        state.filter = {};
        state.sqgTodo = false;
      }
      // reset sqgTodo if no compliance or if compliant
      if (audit.compliance === undefined || audit.compliance.acceptance === "yes") {
        state.sqgTodo = false;
      }
      state.audit = audit;
      updateAll(state);
    },

    showPartialReport: (
      state,
      {
        payload: { report: audit, uri, ids },
      }: PayloadAction<{ report: any; uri: string; ids: number[] }>
    ) => {
      state.audit = audit;
      state.filter = { ids };
      state.tab = "issues";
      state.sqgTodo = false;
      updateAll(state);
    },

    loadKdb: (state, { payload: kdb }: PayloadAction<Kdb>) => {
      state.kdb = kdb;
      updateAll(state);
    },

    changeTab: (state, action: PayloadAction<ReportState["tab"]>) => {
      state.tab = action.payload;
    },

    changeFilter: (state, { payload: filter }: PayloadAction<Filter>) => {
      state.filter = filter;
      updateAll(state);
    },

    setSqgTodo: (state, { payload: todo }: PayloadAction<ReportState["sqgTodo"]>) => {
      state.sqgTodo = todo;
      state.filter = {};
      updateAll(state);
    },

    showNoReport: (state) => {
      // router hook
    },

    goToLine: (state, action: PayloadAction<any>) => {},

    copyIssueId: (state, action: PayloadAction<string>) => {},

    openLink: (state, action: PayloadAction<string>) => {},
  },
});

function updateAll(state: Draft<ReportState>) {
  const { issues, filtered, stats, titles } = processAudit(
    state.sqgTodo ? state.audit.todo! : state.audit.issues,
    state.audit.files,
    state.kdb,
    state.filter
  );

  state.issues = issues;
  state.filtered = filtered;
  state.stats = stats;
  state.issueTitles = titles;
}

function processAudit(byDocument: IssuesByDocument, files: FilesMap, kdb: Kdb, filter: Filter) {
  const issues = flattenIssues(byDocument, files, kdb);
  const stats = getStats(issues, kdb);
  const titles = getIssueTitles(stats);
  const filtered = filterIssues(issues, filter);
  return { issues, filtered, stats, titles };
}

function filterIssues(issues: FlatIssue[], filter: Filter) {
  const byId = (issue: FlatIssue, index: number) =>
    filter.ids === undefined || filter.ids.includes(index);

  const byDomain = (issue: FlatIssue) =>
    filter.domain === undefined || issue.domain === filter?.domain;

  const byGroup = (issue: FlatIssue) => filter.group === undefined || issue.group === filter?.group;

  const byRule = (issue: FlatIssue) => filter?.rule === undefined || issue.id === filter.rule;

  const criticality =
    filter.severity !== undefined ? SeverityLevels.indexOf(filter.severity) + 1 : 0;
  const byCriticality = (issue: FlatIssue) =>
    filter.severity === undefined || issue.criticality >= criticality;

  return issues.filter((issue, index) => {
    return (
      byId(issue, index) &&
      byDomain(issue) &&
      byGroup(issue) &&
      byRule(issue) &&
      byCriticality(issue)
    );
  });
}

function flattenIssues(byDocument: IssuesByDocument, files: FilesMap, kdb: Kdb): FlatIssue[] {
  const issues = Object.entries(byDocument)
    .map(([uri, issues]) => {
      return issues.map((issue, idx) => ({
        ...issue,
        domain: kdb[issue.id].group,
        group: kdb[issue.id].subgroup,
        filename: files[issue.documentUri].relative,
      }));
    })
    .reduce((acc: any, val) => acc.concat(val), []);
  return issues;
}

function getStats(issues: FlatIssue[], kdb: Kdb): Stats {
  const grouped: Record<string, FlatIssue[]> = {};
  for (const issue of issues) {
    if (!grouped[issue.id]) {
      grouped[issue.id] = [];
    }
    grouped[issue.id].push(issue);
  }

  const byIssue = Object.keys(grouped).map((id) => ({
    id,
    kdb: kdb[id] || fallbackArticle,
    title: kdb[id].title.text.replace(/^<h1>|<\/h1>$/g, ""),
    domain: grouped[id][0].domain,
    score: grouped[id].reduce((result, issue) => result + issue.score, 0),
    criticality: Math.max(...grouped[id].map((issue) => issue.criticality)) as CriticalityLevel,
    displayScore: displayScore(grouped[id].reduce((result, issue) => result + issue.score, 0)),
    count: grouped[id].length,
    important: grouped[id].some((issue) => issue.criticality >= Criticality.Low),
  }));

  const byGroup = getStatsByGroup(issues);

  return { byIssue, byGroup };
}

function getStatsByGroup(issues: FlatIssue[]): GroupStats {
  const zeroes = { info: 0, low: 0, medium: 0, high: 0, critical: 0 };
  const stats = {
    oasconformance: {
      validation: { ...zeroes },
      semantics: { ...zeroes },
      bestpractices: { ...zeroes },
    },
    datavalidation: {
      parameters: { ...zeroes },
      paths: { ...zeroes },
      schema: { ...zeroes },
      responseheader: { ...zeroes },
      responsedefinition: { ...zeroes },
    },
    security: {
      authentication: { ...zeroes },
      authorization: { ...zeroes },
      transport: { ...zeroes },
    },
  };

  for (const issue of issues) {
    const domain = issue.domain;
    const group = issue.group;
    const criticality = CriticalityLevelId[issue.criticality];
    if (
      domain !== undefined &&
      group !== undefined &&
      //@ts-ignore
      stats[domain]?.[group]?.[criticality] !== undefined
    ) {
      //@ts-ignore
      stats[domain][group][criticality]++;
    }
  }

  return stats;
}

function getIssueTitles(stats: Stats) {
  return stats.byIssue
    .map((entry) => ({ value: entry.id, label: entry.title }))
    .sort((a, b) => {
      const valueA = a.value.toLowerCase();
      const valueB = b.value.toLowerCase();
      if (valueA < valueB) {
        return -1;
      } else if (valueA > valueB) {
        return 1;
      } else {
        return 0;
      }
    });
}

function displayScore(score: number): string {
  const rounded = Math.abs(Math.round(score));
  if (score === 0) {
    return "0";
  } else if (rounded >= 1) {
    return rounded.toString();
  }
  return "less than 1";
}

const fallbackArticle = {
  title: {
    text: "<h1>Article not found</h1>",
  },
  description: {
    text: `<p>Whoops! Looks like there has been an oversight and we are missing a page for this issue.</p>
           <p><a href="https://apisecurity.io/contact-us/">Let us know</a> the title of the issue, and we make sure to add it to the encyclopedia.</p>`,
  },
};

export const {
  startAudit,
  cancelAudit,
  showFullReport,
  showPartialReport,
  showNoReport,
  loadKdb,
  goToLine,
  copyIssueId,
  openLink,
  changeTab,
  changeFilter,
  setSqgTodo,
} = slice.actions;

export const useFeatureDispatch: () => Dispatch<
  ReturnType<(typeof slice.actions)[keyof typeof slice.actions]>
> = useDispatch;

export const useFeatureSelector: TypedUseSelectorHook<
  StateFromReducersMapObject<Record<typeof slice.name, typeof slice.reducer>>
> = useSelector;

export default slice.reducer;
