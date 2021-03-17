import * as t from 'io-ts';
import Handlebars from 'handlebars';
import YAML from 'yaml';
import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
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
export type Service = t.TypeOf<typeof Service> & { cwd: string };

export const Services = t.record(t.string, Service);
export type Services = t.TypeOf<typeof Services> & { [key: string]: Service };

export const Config = t.type({
  includes: t.union([t.undefined, t.array(t.string)]),
  name: t.union([t.undefined, t.string]),
  services: Services
});
export type Config = t.TypeOf<typeof Config>;

export class ConfigLoader {
  private loaded = new Set<string>();

  private recursiveTemplate(str: string, data: HashMap<string> = {}) {
    const result = Handlebars.compile(str)({
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

  load(config: string | Config, cwd = process.cwd()): Config {
    let configObj = config as Config;
    if (typeof config === 'string') {
      this.loaded.add(config);
      const configStr = fs.readFileSync(config).toString();
      configObj = YAML.parse(this.recursiveTemplate(configStr));
    }
    validate(configObj, Config);
    configObj.services = Object.entries(
      configObj.services as { [key: string]: Service }
    ).reduce(
      (services: Services, [serviceName, service]: [string, Service]) => {
        services[serviceName] = {
          ...service,
          cwd
        };
        return services;
      },
      {}
    );
    const includes = this.getIncludes(configObj.includes);
    configObj = includes.reduce((configObj: Config, includePath: string) => {
      if (this.loaded.has(includePath)) return configObj;
      this.loaded.add(includePath);
      const configLoader = new ConfigLoader();
      const config = configLoader.load(
        includePath,
        path.resolve(cwd, includePath.replace(/[^/]*$/g, ''))
      );
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
