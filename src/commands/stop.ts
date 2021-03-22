import { Command, flags } from '@oclif/command';
import ServiceBlend, { ServiceBlendStopOptions } from '~/index';
import { HashMap } from '~/types';
import { parseArg } from '~/util';

export default class Stop extends Command {
  static description = 'stops service';

  static examples = ['$ serviceblend stop'];

  static flags: flags.Input<any> = {
    all: flags.boolean({ char: 'a', required: false }),
    config: flags.string({ char: 'c', required: false }),
    environment: flags.string({ char: 'e', required: false }),
    name: flags.string({ char: 'n', required: false })
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
    const { flags } = this.parse(Stop);
    const services = this.argv
      .filter((arg: string) => arg[0] !== '-')
      .reduce(
        (services: HashMap<Partial<ServiceBlendStopOptions>>, arg: string) => {
          const {
            serviceName,
            environmentName,
            options
          } = parseArg<ServiceBlendStopOptions>(arg);
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
    await serviceBlend.stop(services, {
      ...(flags.all || !Object.keys(services).length
        ? { all: true }
        : { all: false })
    });
    process.exit();
  }
}
