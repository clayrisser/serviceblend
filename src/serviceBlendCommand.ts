import { Command, flags } from '@oclif/command';
import ConfigLoader from './configLoader';
import ServiceBlend from '.';
import { getOptions, parseConnectionsString } from './util';

export default class ServiceBlendCommand extends Command {
  static description = 'run service';

  static examples = ['$ reactant hello'];

  static flags = {
    debug: flags.boolean({ char: 'd', required: false }),
    openAll: flags.boolean({ char: 'o', required: false })
  };

  static args = [
    { name: 'CONNECTIONS', required: true },
    {
      name: 'ROOT_PATH',
      required: false
    }
  ];

  async run() {
    const { args, flags } = this.parse(ServiceBlendCommand);
    const options = getOptions({
      debug: !!flags.debug,
      openAll: !!flags.openAll
    });
    if (args.ROOT_PATH) options.rootPath = args.ROOT_PATH;
    const configLoader = new ConfigLoader(options);
    await configLoader.load();
    const serviceBlend = new ServiceBlend(configLoader.config, options);
    const connections = parseConnectionsString(args.CONNECTIONS, options);
    return serviceBlend.run(...connections);
  }
}
