import { Command, flags } from '@oclif/command';
import ServiceBlend from '..';
import { Options } from '../types';
import { parseConnectionsString } from '../util';

export default class Start extends Command {
  static description = 'start service';

  static examples = ['$ reactant start hello'];

  static flags = {
    debug: flags.boolean({ char: 'd', required: false })
  };

  static args = [{ name: 'CONNECTIONS', required: true }];

  async run() {
    const { args, flags } = this.parse(Start);
    const options: Options = {
      debug: !!flags.debug
    };
    const connections = parseConnectionsString(args.CONNECTIONS);
    const serviceBlend = new ServiceBlend(options);
    return serviceBlend.start(connections);
  }
}
