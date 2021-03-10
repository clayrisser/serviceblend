import { Command, flags } from '@oclif/command';
import ServiceBlend from '~/index';
import { RunnerMode } from '~/runner';

export default class Run extends Command {
  static description = 'runs service';

  static examples = ['$ serviceblend run'];

  static flags: flags.Input<any> = {
    mode: flags.boolean({ char: 'm', required: false }),
    environment: flags.string({ char: 'e', required: false }),
    project: flags.string({ char: 'p', required: false })
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
    const args = (
      this.argv.filter((arg: string) => arg[0] !== '-')?.[0] || ''
    ).split('=');
    const [serviceName, environmentName] = [args?.[0], args?.[1]];
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
    await serviceBlend.run(serviceName, {
      mode: flags.mode as RunnerMode,
      environmentName
    });
  }
}
