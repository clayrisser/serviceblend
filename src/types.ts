export type EnvironmentName = string;

export interface Connections {
  [serviceName: string]: EnvironmentName;
}

export interface Options {
  debug?: boolean;
  rootPath?: string;
}

export interface Service {}

export interface Services {
  [serviceName: string]: Service;
}

export interface Config {
  services: Services;
}
