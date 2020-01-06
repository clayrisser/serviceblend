import open from 'open';
import { ExecaError } from 'execa';
import { handle } from '@oclif/errors';
import { mapSeries } from 'bluebird';
import defaultOptions from './defaultOptions';
import { Config, Connections, DockerCompose, Options } from './types';
import { dockerUp } from './services/docker';
import { getOptions } from './util';
import { runProcess } from './services/process';

export default class ServiceBlend {
  options: Options;

  constructor(
    public config: Config,
    options: Partial<Options> = defaultOptions
  ) {
    this.options = getOptions(options);
  }

  async run(connections: Connections) {
    Object.entries(connections).forEach(
      ([serviceName, environmentName]: [string, string]) => {
        const service = this.config.services[serviceName];
        if (!service) return;
        const environment = service?.environments[environmentName];
        if (!environment) return;
        if (environment.environment) {
          process.env = { ...process.env, ...environment.environment };
        }
      }
    );
    await mapSeries(
      Object.entries(connections),
      async ([serviceName, environmentName]: [string, string]) => {
        const service = this.config.services[serviceName];
        if (!service) return;
        const environment = service?.environments[environmentName];
        if (!environment) return;
        if (environment.install)
          await runProcess(environment.install, this.options);
        if (
          typeof environment.run === 'string' ||
          Array.isArray(environment.run)
        ) {
          runProcess(environment.run, this.options).catch((err: ExecaError) =>
            handle(new Error(err.shortMessage))
          );
        } else if (typeof environment.run === 'object') {
          dockerUp(
            environment.run as DockerCompose,
            this.options
          ).catch((err: ExecaError) => handle(new Error(err.shortMessage)));
        }
        if (environment.open) await open(environment.open);
      }
    );
  }
}

export * from './services';
export * from './types';
export * from './util';
