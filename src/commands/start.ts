import { Command, flags } from '@oclif/command';
import ServiceBlend from '..';
import { getConfig, getOptions, parseConnectionsString } from '../util';

export default class Start extends Command {
  static description = 'start service';

  static examples = ['$ reactant start hello'];

  static flags = {
    debug: flags.boolean({ char: 'd', required: false }),
    cwd: flags.string({ required: false })
  };

  static args = [{ name: 'CONNECTIONS', required: true }];

  async run() {
    const { args, flags } = this.parse(Start);
    const options = getOptions({
      debug: !!flags.debug
    });
    if (flags.cwd) options.rootPath = flags.cwd;
    const config = await getConfig(options);
    const serviceBlend = new ServiceBlend(config, options);
    const connections = parseConnectionsString(args.CONNECTIONS, options);
    return serviceBlend.start(connections);
  }
}
