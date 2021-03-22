import { Command, flags } from '@oclif/command';
import ServiceBlend, { ServiceBlendRunOptions } from '~/index';
import { HashMap } from '~/types';
import { RunnerMode } from '~/runner';
import { parseArg } from '~/util';

export default class Run extends Command {
  static description = 'runs service';

  static examples = ['$ serviceblend run'];

  static flags: flags.Input<any> = {
    all: flags.boolean({ char: 'a', required: false }),
    config: flags.string({ char: 'c', required: false }),
    detached: flags.boolean({ char: 'd', required: false }),
    environment: flags.string({ char: 'e', required: false }),
    name: flags.string({ char: 'n', required: false }),
    open: flags.boolean({ char: 'o', required: false }),
    terminal: flags.boolean({ char: 't', required: false })
  };

  static strict = false;

  static args = [
    {
      description: 'service names',
      name: 'SERVICENAMES...',
      required: false
    }
  ];

  async run() {
    const { flags } = this.parse(Run);
    const services = this.argv
      .filter((arg: string) => arg[0] !== '-')
      .reduce(
        (services: HashMap<Partial<ServiceBlendRunOptions>>, arg: string) => {
          const {
            serviceName,
            environmentName,
            options
          } = parseArg<ServiceBlendRunOptions>(
            arg,
            {
              d: 'detached',
              detached: { mode: RunnerMode.Detached },
              o: 'open',
              t: 'terminal',
              terminal: { mode: RunnerMode.Terminal }
            },
            { mode }
          );
          services[serviceName] = {
            ...options,
            environmentName
          };
          return services;
        },
        {}
      );
    const serviceBlend = new ServiceBlend({
      ...(flags.environment
        ? {
            defaultEnvironmentName: flags.environment
          }
        : {}),
      ...(flags.name
        ? {
            projectName: flags.name
          }
        : {}),
      ...(flags.config
        ? {
            configPath: flags.config
          }
        : {})
    });
    let mode = RunnerMode.Foreground;
    if (flags.detached) mode = RunnerMode.Detached;
    if (flags.terminal) mode = RunnerMode.Terminal;
    await serviceBlend.run(services, {
      mode,
      ...(flags.all || !Object.keys(services).length
        ? { all: true }
        : { all: false }),
      ...(flags.open ? { open: true } : {})
    });
    process.exit();
  }
}
