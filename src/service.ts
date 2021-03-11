import Environment from '~/environment';
import { HashMap } from '~/types';
import ServiceBlend from '~/index';
import {
  Service as ServiceConfig,
  Environment as EnvironmentConfig
} from '~/config';
import { RunnerMode } from './runner';

export default class Service {
  protected environments: HashMap<Environment> = {};

  constructor(
    public serviceBlend: ServiceBlend,
    public projectName: string,
    public serviceName: string,
    public config: ServiceConfig
  ) {
    if (!Object.keys(config.environments).length) {
      throw new Error('at least 1 environment must be defined');
    }
    Object.entries(config.environments).forEach(
      ([environmentName, environmentConfig]: [string, EnvironmentConfig]) => {
        this.environments[environmentName] = new Environment(
          this,
          environmentName,
          environmentConfig
        );
      }
    );
  }

  async run(environmentName: string, options: Partial<ServiceRunOptions> = {}) {
    const { mode } = {
      mode: RunnerMode.Foreground,
      ...options
    };
    if (!environmentName) {
      environmentName = Object.keys(this.environments)?.[0];
      if (!environmentName) {
        throw new Error('at least 1 environment must be defined');
      }
    }
    const environment = this.environments[environmentName];
    if (!environment) {
      throw new Error(`environment '${environmentName}' does not exist`);
    }
    return environment.run({ mode });
  }

  async stop(
    environmentName: string,
    _options: Partial<ServiceStopOptions> = {}
  ) {
    if (!environmentName) {
      environmentName = Object.keys(this.environments)?.[0];
      if (!environmentName) {
        throw new Error('at least 1 environment must be defined');
      }
    }
    const environment = this.environments[environmentName];
    if (!environment) {
      throw new Error(`environment '${environmentName}' does not exist`);
    }
    return environment.stop();
  }

  async onStop(code?: string | number) {
    await Promise.all(
      Object.values(this.environments).map(async (environment: Environment) => {
        await environment.onStop(code);
      })
    );
  }
}

export interface ServiceRunOptions {
  mode: RunnerMode;
}

export interface ServiceStopOptions {}
