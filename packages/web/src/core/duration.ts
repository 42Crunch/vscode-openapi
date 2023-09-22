const units = [
  "hours",
  "minutes",
  "seconds",
  "milliseconds",
  "microseconds",
  "nanoseconds",
] as const;

type Unit = (typeof units)[number];
const r = (name: Unit, suffix: string): string => `((?<${name}>\\d*[\\.]?\\d+)${suffix})?`;

const durationRegex = new RegExp(
  [
    "^",
    "(?<signed>[-+])?",
    r("hours", "h"),
    r("minutes", "m"),
    r("seconds", "s"),
    r("milliseconds", "ms"),
    r("microseconds", "us|µs|μs"),
    r("nanoseconds", "ns"),
    "$",
  ].join("")
);

const convert: Record<Unit, (value: number | undefined) => number | undefined> = {
  hours: function (value: number | undefined): number | undefined {
    return value === undefined ? undefined : value * 3600000;
  },
  minutes: function (value: number | undefined): number | undefined {
    return value === undefined ? undefined : value * 60000;
  },
  seconds: function (value: number | undefined): number | undefined {
    return value === undefined ? undefined : value * 1000;
  },
  milliseconds: function (value: number | undefined): number | undefined {
    return value === undefined ? undefined : value;
  },
  microseconds: function (value: number | undefined): number | undefined {
    return value === undefined ? undefined : 0;
  },
  nanoseconds: function (value: number | undefined): number | undefined {
    return value === undefined ? undefined : 0;
  },
};

// parses "duration" to ms or undefined if parsing fails
export function parseDuration(duration: string): number | undefined {
  const match = durationRegex.exec(duration);
  if (!match || !match.groups) {
    return undefined;
  }

  let result: number | undefined = undefined;

  for (const unit of units) {
    if (match.groups[unit]) {
      const ms = convert[unit](parseNum(match.groups[unit]));
      if (result === undefined) {
        result = ms === undefined ? undefined : ms;
      } else {
        result = ms === undefined ? result : result + ms;
      }
    }
  }

  return result;
}

function parseNum(s: string | undefined): number | undefined {
  if (s === undefined) {
    return undefined;
  }

  return parseFloat(s);
}
