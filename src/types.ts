import { ExecaChildProcess } from 'execa';

export type Terminal = [string, string[]];

export interface EnvironmentVariables {
  [key: string]: string | undefined;
}

export interface EnvironmentMap {
  [key: string]: string;
}

export interface TerminalMap {
  [terminalName: string]: Terminal;
}

export interface Processes {
  [key: number]: ExecaChildProcess;
}

export type Command = string | Array<string>;

export interface Connections {
  [serviceName: string]: string;
}

export interface Options {
  debug?: boolean;
  openAll?: boolean;
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
  dependsOn?: string[];
  environment?: EnvironmentVariables;
  environmentMap?: EnvironmentMap;
  install?: string | string[];
  open?: string;
  run?: Run;
}

export interface Environments {
  [environmentName: string]: Environment;
}

export interface ServiceRc {
  dependsOn?: string[];
  environments: Environments;
  local?: string;
}

export interface ServicesRc {
  [serviceName: string]: ServiceRc;
}

export interface ServiceBlendRc {
  services: ServicesRc;
}

export interface Service extends ServiceRc {
  localEnvironment?: Environment;
}

export interface Services {
  [serviceName: string]: Service;
}

export interface Config extends ServiceBlendRc {
  localServices: Services;
  dependencyServices: Services;
}
