import { Command, flags } from '@oclif/command';
import ServiceBlend from '.';
import { getConfig, getOptions, parseConnectionsString } from './util';

export default class ServiceBlendCommand extends Command {
  static description = 'run service';

  static examples = ['$ reactant hello'];

  static flags = {
    debug: flags.boolean({ char: 'd', required: false }),
    cwd: flags.string({ required: false })
  };

  static args = [{ name: 'CONNECTIONS', required: true }];

  async run() {
    const { args, flags } = this.parse(ServiceBlendCommand);
    const options = getOptions({
      debug: !!flags.debug
    });
    if (flags.cwd) options.rootPath = flags.cwd;
    const config = await getConfig(options);
    const serviceBlend = new ServiceBlend(config, options);
    const connections = parseConnectionsString(args.CONNECTIONS, options);
    return serviceBlend.run(connections);
  }
}
