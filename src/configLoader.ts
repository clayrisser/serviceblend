import glob from 'glob';
import path from 'path';
import { cosmiconfig } from 'cosmiconfig';
import { mapSeries } from 'bluebird';
import defaultConfig from './defaultConfig';
import defaultOptions from './defaultOptions';
import { Config, Options, Service, Services } from './types';

export default class ConfigLoader {
  config: Config;

  constructor(public options: Options = defaultOptions) {}

  getServicesFromName(serviceNames: string[]): Services {
    const serviceNamesSet = new Set<string>(serviceNames);
    return Object.entries(this.config.services).reduce(
      (services: Services, [serviceName, service]: [string, Service]) => {
        if (serviceNamesSet.has(serviceName)) services[serviceName] = service;
        return services;
      },
      {}
    );
  }

  getAllServices(
    services: Services,
    registeredServices: Set<string> = new Set()
  ): Services {
    registeredServices = new Set([
      ...registeredServices,
      ...Object.keys(services)
    ]);
    return Object.entries(services).reduce(
      (services: Services, [serviceName, service]: [string, Service]) => {
        if (service.dependsOn) {
          const dependsOn = service.dependsOn.filter((serviceName: string) =>
            registeredServices.has(serviceName)
          );
          Object.entries(
            this.getAllServices(
              this.getServicesFromName(dependsOn),
              registeredServices
            )
          ).forEach(([serviceName, service]: [string, Service]) => {
            services[serviceName] = service;
          });
        }
        services[serviceName] = service;
        return services;
      },
      {}
    );
  }

  getDependencyServices(
    services: Services,
    localServicesNames: string[]
  ): Services {
    const clonedServices = { ...services };
    localServicesNames.forEach((serviceName: string) => {
      delete clonedServices[serviceName];
    });
    return clonedServices;
  }

  async getPartialConfig(
    configPath: string,
    _options: Options = defaultOptions
  ): Promise<Config> {
    let config: Config;
    try {
      const payload = await cosmiconfig('serviceblend').load(configPath);
      config = (payload && payload.config ? payload.config : {}) as Config;
    } catch (err) {
      if (err.name !== 'YAMLException') throw err;
      // eslint-disable-next-line import/no-dynamic-require,global-require,no-eval
      config = eval(`require(${err.mark.name})`);
    }
    return config;
  }

  async load(options: Options = defaultOptions): Promise<Config> {
    const config: Config = defaultConfig;
    const { rootPath } = options;
    const matches = await new Promise<string[]>((resolve, reject) => {
      glob(
        '**/.serviceblendrc{,.js,.json,.yml,.yaml}',
        { cwd: rootPath, ignore: 'node_modules/**/*' },
        (err: Error | null, matches: string[]) => {
          if (err) return reject(err);
          return resolve(matches);
        }
      );
    });
    if (!matches.length) return config;
    const match = matches.shift()!;
    const partialConfig = await this.getPartialConfig(
      path.resolve(rootPath, match),
      options
    );
    Object.entries(partialConfig.services || {}).forEach(
      ([serviceName, service]: [string, Service]) => {
        if (service.local) {
          service.localEnvironment = service.environments[service.local];
          if (!service.localEnvironment) return;
          config.localServices[serviceName] = service;
        } else {
          config.services[serviceName] = service;
        }
      }
    );
    this.config = (
      await mapSeries(matches, async (match: string) => {
        return this.getPartialConfig(path.resolve(rootPath, match), options);
      })
    ).reduce((config: Config, partialConfig: Partial<Config>) => {
      Object.entries(partialConfig.services || {}).forEach(
        ([serviceName, service]: [string, Service]) => {
          config.services[serviceName] = service;
        }
      );
      return config;
    }, config);
    this.config.dependencyServices = this.getDependencyServices(
      this.getAllServices(this.config.services),
      Object.keys(this.config.localServices)
    );
    return this.config;
  }
}
