export type EnvironmentName = string;

export interface Connections {
  [serviceName: string]: EnvironmentName;
}

export interface Options {
  debug?: boolean;
}
