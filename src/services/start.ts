import open from 'open';
import { ExecaError } from 'execa';
import { handle } from '@oclif/errors';
import { mapSeries } from 'bluebird';
import { Config, Connections, DockerCompose, Options } from '../types';
import { dockerUp } from './docker';
import { runProcess } from './process';

export async function start(
  connections: Connections,
  config: Config,
  options: Options
) {
  await mapSeries(
    Object.entries(connections),
    async ([serviceName, environmentName]: [string, string]) => {
      const service = config.services[serviceName];
      if (!service) return;
      const environment = service?.environments[environmentName];
      if (!environment) return;
      if (environment.install) await runProcess(environment.install, options);
      if (
        typeof environment.start === 'string' ||
        Array.isArray(environment.start)
      ) {
        runProcess(environment.start, options).catch((err: ExecaError) =>
          handle(new Error(err.shortMessage))
        );
      } else if (typeof environment.start === 'object') {
        dockerUp(
          environment.start as DockerCompose,
          options
        ).catch((err: ExecaError) => handle(new Error(err.shortMessage)));
      }
      if (environment.open) await open(environment.open);
    }
  );
}
