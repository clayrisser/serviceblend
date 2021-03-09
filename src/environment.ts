import { IEnvironment } from '~/config';
import { getPlugin } from '~/plugins';
import Plugin from '~/plugin';

export default class Environment {
  protected plugin: Plugin;

  constructor(public projectName: string, public config: IEnvironment) {
    this.plugin = getPlugin(
      projectName,
      (config.plugin as unknown) as string,
      config.definition
    );
  }

  async run(options: Partial<EnvironmentRunOptions> = {}) {
    const { daemon } = {
      daemon: false,
      ...options
    };
    return this.plugin.run({ daemon });
  }

  async onStop() {
    await this.plugin.onStop();
  }
}

export interface EnvironmentRunOptions {
  daemon: boolean;
}
