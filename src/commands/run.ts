import { Command, flags } from '@oclif/command';
import ServiceBlend, { ServiceBlendRunOptions } from '~/index';
import { HashMap } from '~/types';
import { RunnerMode } from '~/runner';

export default class Run extends Command {
  static description = 'runs service';

  static examples = ['$ serviceblend run'];

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
    const { flags } = this.parse(Run);
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
    let mode = RunnerMode.Foreground;
    if (flags.detached) mode = RunnerMode.Detatched;
    if (flags.terminal) mode = RunnerMode.Terminal;
    await serviceBlend.run(
      this.argv
        .filter((arg: string) => arg[0] !== '-')
        .reduce(
          (services: HashMap<Partial<ServiceBlendRunOptions>>, arg: string) => {
            const argArr = arg.split(':');
            const serviceBlock = argArr.shift()?.split('=') || [];
            const optionBlocks = argArr.join(':').split(',');
            const [serviceName, environmentName] = [
              serviceBlock?.[0],
              serviceBlock?.[1]
            ];
            const options: Partial<ServiceBlendRunOptions> = {
              environmentName,
              mode,
              ...optionBlocks.reduce(
                (
                  options: Partial<ServiceBlendRunOptions>,
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
