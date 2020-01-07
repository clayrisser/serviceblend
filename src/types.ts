import * as t from 'io-ts';
import { ExecaChildProcess } from 'execa';

export type Terminal = [string, string[]];

export const Env = t.record(t.string, t.union([t.string, t.undefined]));
export type Env = t.TypeOf<typeof Env>;

export const EnvMap = t.record(t.string, t.string);
export type EnvMap = t.TypeOf<typeof EnvMap>;

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

export const DockerComposeService = t.UnknownRecord;
export type DockerComposeService = t.TypeOf<typeof DockerComposeService>;

export const DockerComposeServices = t.record(t.string, DockerComposeService);
export type DockerComposeServices = t.TypeOf<typeof DockerComposeServices>;

export const DockerCompose = t.type({
  version: t.union([t.string, t.undefined]),
  services: t.union([DockerComposeServices, t.undefined])
});
export type DockerCompose = t.TypeOf<typeof DockerCompose>;

export const Run = t.union([DockerCompose, t.string, t.array(t.string)]);
export type Run = t.TypeOf<typeof Run>;

export const Environment = t.type({
  dependsOn: t.union([t.array(t.string), t.undefined]),
  env: t.union([Env, t.undefined]),
  envMap: t.union([EnvMap, t.undefined]),
  install: t.union([t.string, t.array(t.string), t.undefined]),
  open: t.union([t.string, t.array(t.string), t.undefined]),
  run: t.union([Run, t.undefined])
});
export type Environment = t.TypeOf<typeof Environment>;

export const Environments = t.record(t.string, Environment);
export type Environments = t.TypeOf<typeof Environments>;

export const ServiceRc = t.union([
  t.string,
  t.type({
    dependsOn: t.union([t.array(t.string), t.undefined]),
    environments: Environments,
    local: t.union([t.string, t.undefined])
  })
]);
export type ServiceRc = t.TypeOf<typeof ServiceRc>;

export const ServicesRc = t.record(t.string, ServiceRc);
export type ServicesRc = t.TypeOf<typeof ServicesRc>;

export const ServiceBlendRc = t.type({
  services: ServicesRc
});
export type ServiceBlendRc = t.TypeOf<typeof ServiceBlendRc>;

export interface Service {
  dependsOn: string[] | undefined;
  environments: Environments;
  local: string | undefined;
  localEnvironment: Environment | undefined;
}

export interface Services {
  [serviceName: string]: Service;
}

export interface Config {
  dependencyServices: Services;
  localServices: Services;
  services: ServicesRc;
}
