import { Command, flags } from '@oclif/command';
import ConfigLoader from './configLoader';
import ServiceBlend from '.';
import { getOptions, parseConnectionsString } from './util';

export default class ServiceBlendCommand extends Command {
  static description = 'run service';

  static examples = ['$ reactant hello'];

  static flags = {
    cwd: flags.string({ required: false }),
    debug: flags.boolean({ char: 'd', required: false }),
    openAll: flags.boolean({ char: 'o', required: false })
  };

  static args = [{ name: 'CONNECTIONS', required: true }];

  async run() {
    const { args, flags } = this.parse(ServiceBlendCommand);
    const options = getOptions({
      debug: !!flags.debug,
      openAll: !!flags.openAll
    });
    if (flags.cwd) options.rootPath = flags.cwd;
    const configLoader = new ConfigLoader(options);
    await configLoader.load();
    const serviceBlend = new ServiceBlend(configLoader.config, options);
    console.log(configLoader.config);
    const connections = parseConnectionsString(args.CONNECTIONS, options);
    return serviceBlend.run(...connections);
  }
}
