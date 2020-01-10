import open from 'open';
import { ExecaError } from 'execa';
import { handle } from '@oclif/errors';
import { mapSeries } from 'bluebird';
import defaultOptions from './defaultOptions';
import { dockerUp } from './services/docker';
import { getOptions } from './util';
import { runProcess } from './services/process';
import {
  Config,
  Connections,
  DockerCompose,
  Environment,
  Options,
  Service,
  Services,
  Env
} from './types';

export default class ServiceBlend {
  options: Options;

  constructor(
    public config: Config,
    options: Partial<Options> = defaultOptions
  ) {
    this.options = getOptions(options);
  }

  getEnvironmentsFromServices(
    services: Services,
    defaultConnection: string | null,
    connections: Connections = {}
  ): Environment[] {
    return Object.entries(services).reduce(
      (
        environments: Environment[],
        [serviceName, service]: [string, Service]
      ) => {
        const environmentName = connections[serviceName] || defaultConnection;
        if (environmentName) {
          const environment = service?.environments[environmentName];
          if (environment) {
            environments.push(environment);
          }
        }
        return environments;
      },
      []
    );
  }

  async run(defaultConnection: string | null, connections: Connections) {
    const environments = this.getEnvironmentsFromServices(
      this.config.dependencyServices,
      defaultConnection,
      connections
    );
    environments.forEach((environment: Environment) => {
      if (environment.env) {
        process.env = { ...process.env, ...environment.env };
      }
    });
    await mapSeries(environments, async (environment: Environment) => {
      this.runEnvironment(environment, !!this.options.openAll);
    });
    await mapSeries(
      Object.values(this.config.localServices),
      async (service: Service) => {
        if (!service.localEnvironment) return;
        this.runEnvironment(service.localEnvironment, true, 'first');
      }
    );
  }

  async runEnvironment(
    environment: Environment,
    openLink = false,
    newTerminal = 'always'
  ) {
    const env = Object.entries(environment.envMap || {}).reduce(
      (env: Env, [key, value]: [string, string | undefined]) => {
        if (value) env[key] = process.env[value];
        return env;
      },
      {}
    );
    if (environment.install) {
      await runProcess(
        environment.install,
        this.options,
        env,
        newTerminal === 'first' ? 'first' : 'always'
      ).catch((err: ExecaError) => handle(new Error(err.shortMessage)));
    }
    if (typeof environment.run === 'string' || Array.isArray(environment.run)) {
      runProcess(
        environment.run,
        this.options,
        env,
        newTerminal === 'first' ? 'first' : 'always'
      ).catch((err: ExecaError) => handle(new Error(err.shortMessage)));
    } else if (typeof environment.run === 'object') {
      dockerUp(
        environment.run as DockerCompose,
        this.options,
        env,
        newTerminal === 'first' ? 'first' : 'always'
      ).catch((err: ExecaError) => handle(new Error(err.shortMessage)));
    }
    if (openLink && environment.open) {
      if (typeof environment.open === 'string') {
        environment.open = [environment.open];
      }
      await mapSeries(environment.open, (openLink: string) => open(openLink));
    }
  }
}

export * from './services';
export * from './types';
export * from './util';
