import { Command } from '@oclif/command';
import ServiceBlend from '~/index';

export default class Up extends Command {
  static description = 'starts services';

  static examples = ['$ serviceblend up'];

  static flags = {};

  static args = [];

  async run() {
    const serviceBlend = new ServiceBlend();
    await serviceBlend.up();
  }
}
