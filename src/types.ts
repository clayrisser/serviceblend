import { ExecaChildProcess } from 'execa';

export type Terminal = [string, string[]];

export interface EnvironmentVariables {
  [key: string]: string;
}

export interface TerminalMap {
  [terminalName: string]: Terminal;
}

export interface Processes {
  [key: number]: ExecaChildProcess;
}

export type EnvironmentName = string;

export type Command = string | Array<string>;

export interface Connections {
  [serviceName: string]: EnvironmentName;
}

export interface Options {
  debug?: boolean;
  rootPath: string;
}

export interface DockerComposeService {}

export interface DockerComposeServices {
  [serviceName: string]: DockerComposeService;
}

export interface DockerCompose {
  version?: string;
  services?: DockerComposeServices;
}

export type Run = DockerCompose | string | string[];

export interface Environment {
  environment?: EnvironmentVariables;
  install?: string | string[];
  open?: string;
  run?: Run;
}

export interface Environments {
  [environmentName: string]: Environment;
}

export interface Service {
  environments: Environments;
}

export interface Services {
  [serviceName: string]: Service;
}

export interface Config {
  services: Services;
}
