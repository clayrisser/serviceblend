import * as t from 'io-ts';
import YAML from 'yaml';
import fs from 'fs-extra';
import { PathReporter } from 'io-ts/PathReporter';

export const Environment = t.type({
  apparatus: t.string,
  definition: t.unknown
});
export type Environment = t.TypeOf<typeof Environment>;

export const Environments = t.record(t.string, Environment);
export type Environments = t.TypeOf<typeof Environments>;

export const Service = t.type({
  default: t.union([t.undefined, t.string]),
  environments: Environments
});
export type Service = t.TypeOf<typeof Service>;

export const Services = t.record(t.string, Service);
export type Services = t.TypeOf<typeof Services>;

export const Config = t.type({
  services: Services
});
export type Config = t.TypeOf<typeof Config>;

export async function loadConfig(config: string | Config): Promise<Config> {
  let configObj = config as Config;
  if (typeof config === 'string') {
    const configStr = (await fs.readFile(config)).toString();
    configObj = YAML.parse(configStr);
  }
  validate(configObj, Config);
  return configObj;
}

export function validate<T = any>(value: T, Type: t.Type<any>) {
  const errors = PathReporter.report(Type.decode(value));
  const message = errors.join('; ');
  if (message === 'No errors!') return;
  throw new Error(message);
}
