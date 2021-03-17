import * as t from 'io-ts';
import Handlebars from 'handlebars';
import YAML from 'yaml';
import fs from 'fs-extra';
import glob from 'glob';
import { HashMap } from '~/types';
import { validate } from '~/util';

export const Environment = t.type({
  apparatus: t.string,
  definition: t.unknown,
  endpoint: t.union([t.undefined, t.string]),
  envs: t.union([t.undefined, t.record(t.string, t.string)]),
  labels: t.union([t.undefined, t.record(t.string, t.string)]),
  open: t.union([t.undefined, t.boolean])
});
export type Environment = t.TypeOf<typeof Environment>;

export const Environments = t.record(t.string, Environment);
export type Environments = t.TypeOf<typeof Environments>;

export const Service = t.type({
  default: t.union([t.undefined, t.string]),
  environments: Environments,
  labels: t.union([t.undefined, t.record(t.string, t.string)])
});
export type Service = t.TypeOf<typeof Service>;

export const Services = t.record(t.string, Service);
export type Services = t.TypeOf<typeof Services>;

export const Config = t.type({
  services: Services,
  includes: t.union([t.undefined, t.array(t.string)])
});
export type Config = t.TypeOf<typeof Config>;

export class ConfigLoader {
  private data: HashMap<any>;

  constructor(data: HashMap<any> = {}, private loaded = new Set<string>()) {
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

  private getIncludes(globs: string[] = []) {
    return globs.reduce((includes: string[], globStr: string) => {
      includes = [...includes, ...glob.sync(globStr)];
      return includes;
    }, []);
  }

  load(config: string | Config): Config {
    let configObj = config as Config;
    if (typeof config === 'string') {
      this.loaded.add(config);
      const configStr = fs.readFileSync(config).toString();
      configObj = YAML.parse(this.recursiveTemplate(configStr));
    }
    validate(configObj, Config);
    const includes = this.getIncludes(configObj.includes);
    configObj = includes.reduce((configObj: Config, includePath: string) => {
      if (this.loaded.has(includePath)) return configObj;
      this.loaded.add(includePath);
      const configLoader = new ConfigLoader(this.loaded);
      const config = configLoader.load(includePath);
      configObj = {
        ...configObj,
        services: {
          ...config.services,
          ...configObj.services
        }
      };
      return configObj;
    }, configObj);
    return configObj;
  }
}
