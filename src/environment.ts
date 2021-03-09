import { IEnvironment } from '~/config';
import { getPlugin } from '~/plugins';
import Plugin from '~/plugin';

export default class Environment {
  protected plugin: Plugin;

  constructor(public config: IEnvironment) {
    this.plugin = getPlugin(
      (config.plugin as unknown) as string,
      config.definition
    );
  }

  async run() {
    return this.plugin.run();
  }

  async onStop() {
    await this.plugin.onStop();
  }
}
