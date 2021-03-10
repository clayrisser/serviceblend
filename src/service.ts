import { IService, IEnvironment } from '~/config';
import Environment from '~/environment';
import { HashMap } from '~/types';

export default class Service {
  protected environments: HashMap<Environment> = {};

  constructor(public projectName: string, public config: IService) {
    if (!Object.keys(config.environments).length) {
      throw new Error('at least 1 environment must be defined');
    }
    Object.entries(config.environments).forEach(
      ([key, value]: [string, IEnvironment]) => {
        this.environments[key] = new Environment(projectName, value);
      }
    );
  }

  async run(environmentName: string, options: Partial<ServiceRunOptions> = {}) {
    const { daemon } = {
      daemon: false,
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
    return environment.run({ daemon });
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

  async onStop() {
    await Promise.all(
      Object.values(this.environments).map(async (environment: Environment) => {
        await environment.onStop();
      })
    );
  }
}

export interface ServiceRunOptions {
  daemon: boolean;
}

export interface ServiceStopOptions {
  daemon: boolean;
}
