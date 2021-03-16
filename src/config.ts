import * as t from 'io-ts';
import Handlebars from 'handlebars';
import YAML from 'yaml';
import fs from 'fs-extra';
import { HashMap } from '~/types';
import { validate } from '~/util';

export const Environment = t.type({
  apparatus: t.string,
  definition: t.unknown,
  endpoint: t.union([t.undefined, t.string]),
  envs: t.union([t.undefined, t.record(t.string, t.string)]),
  open: t.union([t.undefined, t.boolean])
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

export class ConfigLoader {
  private data: HashMap<any>;

  constructor(data: HashMap<any> = {}) {
    this.data = { ...data };
  }

  private recursiveTemplate(str: string, data: HashMap<string> = {}) {
    const result = Handlebars.compile(str)({
      ...this.data,
      ...data,
      ...YAML.parse(str),
      env: process.env
    });
    if (result === str) return result;
    return this.recursiveTemplate(result, data);
  }

  load(config: string | Config): Config {
    let configObj = config as Config;
    if (typeof config === 'string') {
      const configStr = fs.readFileSync(config).toString();
      configObj = YAML.parse(this.recursiveTemplate(configStr));
    }
    validate(configObj, Config);
    return configObj;
  }
}
