import { Command, flags } from '@oclif/command';
import ServiceBlend, { ServiceBlendStopOptions } from '~/index';
import { HashMap } from '~/types';

export default class Stop extends Command {
  static description = 'stops service';

  static examples = ['$ serviceblend stop'];

  static flags: flags.Input<any> = {
    detached: flags.boolean({ char: 'd', required: false }),
    environment: flags.string({ char: 'e', required: false }),
    project: flags.string({ char: 'p', required: false }),
    terminal: flags.boolean({ char: 't', required: false })
  };

  static strict = false;

  static args = [
    {
      description: 'service names',
      name: 'SERVICENAMES...',
      required: true
    }
  ];

  async run() {
    const { flags } = this.parse(Stop);
    const serviceBlend = new ServiceBlend({
      ...(flags.environment
        ? {
            defaultEnvironmentName: flags.environment
          }
        : {}),
      ...(flags.project
        ? {
            projectName: flags.project
          }
        : {})
    });
    await serviceBlend.stop(
      this.argv
        .filter((arg: string) => arg[0] !== '-')
        .reduce(
          (
            services: HashMap<Partial<ServiceBlendStopOptions>>,
            arg: string
          ) => {
            const argArr = arg.split(':');
            const serviceBlock = argArr.shift()?.split('=') || [];
            const optionBlocks = argArr.join(':').split(',');
            const [serviceName, environmentName] = [
              serviceBlock?.[0],
              serviceBlock?.[1]
            ];
            const options: Partial<ServiceBlendStopOptions> = {
              environmentName,
              ...optionBlocks.reduce(
                (
                  options: Partial<ServiceBlendStopOptions>,
                  _optionBlock: string
                ) => {
                  return options;
                },
                {}
              )
            };
            services[serviceName] = options;
            return services;
          },
          {}
        )
    );
  }
}
