import glob from 'fast-glob';
import path from 'path';
import { cosmiconfig } from 'cosmiconfig';
import { mapSeries } from 'bluebird';
import { reporter } from 'io-ts-reporters';
import defaultConfig from './defaultConfig';
import defaultOptions from './defaultOptions';
import {
  Config,
  Options,
  Service,
  ServiceBlendRc,
  ServiceRc,
  Services
} from './types';

export default class ConfigLoader {
  config: Config = defaultConfig;

  constructor(public options: Options = defaultOptions) {}

  getServicesFromName(serviceNames: string[]): Services {
    const serviceNamesSet = new Set<string>(serviceNames);
    return Object.entries((this.config.services as unknown) as Services).reduce(
      (
        services: Services,
        [serviceName, service]: [string, Service | string]
      ) => {
        if (typeof service === 'string') {
          service = this.config.services[service] as Service;
        }
        if (service && serviceNamesSet.has(serviceName)) {
          services[serviceName] = service;
        }
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
          const dependsOn = service.dependsOn.filter(
            (serviceName: string) => !registeredServices.has(serviceName)
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
    let config: unknown;
    try {
      const payload = await cosmiconfig('serviceblend').load(configPath);
      config = payload && payload.config ? payload.config : {};
    } catch (err) {
      if (err.name !== 'YAMLException') throw err;
      // eslint-disable-next-line import/no-dynamic-require,global-require,no-eval
      config = eval(`require(${err.mark.name})`);
    }
    return this.validate(config);
  }

  validate(config: unknown): Config {
    const errors = reporter(ServiceBlendRc.decode(config));
    if (errors.length) throw new Error(errors.join('\n\n'));
    return config as Config;
  }

  async load(): Promise<Config> {
    const config: Config = defaultConfig;
    const { rootPath } = this.options;
    const matches = await glob(
      ['**/.serviceblendrc{,.js,.json,.yml,.yaml}', '!node_modules/**/*'],
      {
        cwd: rootPath
      }
    );
    if (!matches.length) return config;
    const match = matches.find((match: string) => match.indexOf('/') <= -1)!;
    if (!match) return this.config;
    const partialConfig = await this.getPartialConfig(
      path.resolve(rootPath, match),
      this.options
    );
    Object.entries(
      ((partialConfig.services || {}) as unknown) as Services
    ).forEach(([serviceName, service]: [string, Service | string]) => {
      if (typeof service !== 'string' && service.local) {
        service.localEnvironment = service.environments[service.local];
        if (!service.localEnvironment) return;
        config.localServices[serviceName] = service;
      } else {
        config.services[serviceName] = (service as unknown) as ServiceRc;
      }
    });
    this.config = (
      await mapSeries(matches, async (match: string) => {
        return this.getPartialConfig(
          path.resolve(rootPath, match),
          this.options
        );
      })
    ).reduce((config: Config, partialConfig: Partial<Config>) => {
      Object.entries(
        ((partialConfig.services || {}) as unknown) as Services
      ).forEach(([serviceName, service]: [string, Service | string]) => {
        config.services[serviceName] = (service as unknown) as ServiceRc;
      });
      return config;
    }, config);
    this.config.dependencyServices = this.getDependencyServices(
      this.getAllServices(this.config.localServices),
      Object.keys(this.config.localServices)
    );
    return this.config;
  }
}
