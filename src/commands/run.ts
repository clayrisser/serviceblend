import { Command, flags } from '@oclif/command';
import ServiceBlend from '~/index';

export default class Run extends Command {
  static description = 'runs service';

  static examples = ['$ serviceblend run'];

  static flags: flags.Input<any> = {
    environment: flags.string({ char: 'e', required: false })
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
      defaultEnvironmentName: flags.environment
    });
    await serviceBlend.run(serviceName, { environmentName });
  }
}
