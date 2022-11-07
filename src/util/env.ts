export class EnvVar {
  envVarName: string;

  constructor(envVarName: string) {
    this.envVarName = envVarName;
  }

  getString(): string | undefined {
    return process.env[this.envVarName];
  }

  getStringOrFail(): string {
    const envVarValue = process.env[this.envVarName];
    if (!envVarValue) {
      throw Error(`${this.envVarName} not set`);
    }
    return envVarValue;
  }

  getStringOrDefault(defaultValue: string): string {
    const envVarValue = process.env[this.envVarName];
    if (!envVarValue) {
      return defaultValue;
    }
    return envVarValue;
  }

  getBooleanOrDefault(defaultValue: boolean): boolean {
    const envVarValue = process.env[this.envVarName];
    if (!envVarValue) {
      return defaultValue;
    }
    return envVarValue.toLowerCase().trim() === "true";
  }

  getNumberOrDefault(defaultValue: number): number {
    const envVarValue = process.env[this.envVarName];
    if (!envVarValue) {
      return defaultValue;
    }
    return Number(envVarValue);
  }
}
