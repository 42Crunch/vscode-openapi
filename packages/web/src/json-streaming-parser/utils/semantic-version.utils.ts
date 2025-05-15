import { SemanticVersion } from '../models/semantic-version';

export class SemanticVersionUtils {
  static parse(value: string): SemanticVersion {
    // Sometimes we have "-beta" ending in version, e.g. 2.0.0-beta
    // We need to get rid of "-beta", otherwise we get an error
    const parts = value.split('.').map((item: string) => (item.includes('-') ? item.split('-')[0] : item));

    const major = +parts[0];
    const minor = parts.length >= 2 ? +parts[1] : 0;
    const patch = parts.length >= 3 ? +parts[2] : 0;

    [major, minor, patch].forEach((item: number) => {
      if (Number.isNaN(item)) {
        throw new Error(`Invalid semantic version: "${value}".`);
      }
    });

    return new SemanticVersion({ major: major, minor: minor, patch: patch });
  }

  static compare(firstVersion: SemanticVersion, secondVersion: SemanticVersion, majorMinorOnly = false): number {
    const fullVersion = {
      firstVersionParts: [firstVersion?.major || 0, firstVersion?.minor || 0, firstVersion?.patch || 0],
      secondVersionParts: [secondVersion?.major || 0, secondVersion?.minor || 0, secondVersion?.patch || 0]
    };
    const majorMinorVersion = {
      firstVersionParts: [firstVersion?.major || 0, firstVersion?.minor || 0],
      secondVersionParts: [secondVersion?.major || 0, secondVersion?.minor || 0]
    };

    const version = majorMinorOnly ? majorMinorVersion : fullVersion;

    for (let i = 0; i <= version.firstVersionParts.length; i++) {
      const versionPartDiff = version.firstVersionParts[i] - version.secondVersionParts[i];
      if (versionPartDiff < 0) {
        return -1;
      } else if (versionPartDiff > 0) {
        return 1;
      }
    }

    return 0;
  }
}
