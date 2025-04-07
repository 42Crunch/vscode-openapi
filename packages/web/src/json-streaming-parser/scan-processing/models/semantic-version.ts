export class SemanticVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;

  constructor({ major, minor, patch }: Partial<SemanticVersion> = {}) {
    this.major = major || 0;
    this.minor = minor || 0;
    this.patch = patch || 0;
  }
}
