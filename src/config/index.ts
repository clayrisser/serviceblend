import * as t from 'io-ts';
import YAML from 'yaml';
import fs from 'fs-extra';
import { PathReporter } from 'io-ts/PathReporter';
import { HashMap } from '~/types';

export const Environment = t.type({
  plugin: t.string,
  definition: t.unknown
});
export type IEnvironment = typeof Environment.props;

export const Environments = t.record(t.string, Environment);
export type IEnvironments = HashMap<IEnvironment>;

export const Service = t.type({
  default: t.union([t.undefined, t.string]),
  environments: Environments
});
export type IService = typeof Service.props;

export const Services = t.record(t.string, Service);
export type IServices = HashMap<IService>;

export const Config = t.type({
  services: Services
});
export type TConfig = typeof Config.props;

export async function loadConfig(config: string | TConfig) {
  if (typeof config === 'string') {
    const configStr = (await fs.readFile(config)).toString();
    config = YAML.parse(configStr);
  }
  validate(config, Config);
  return config as TConfig;
}

export function validate<T = any>(value: T, Type: t.Type<any>) {
  const errors = PathReporter.report(Type.decode(value));
  const message = errors.join('; ');
  if (message === 'No errors!') return;
  throw new Error(message);
}
