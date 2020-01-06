import defaultOptions from './defaultOptions';
import { Config, Connections, Options } from './types';
import { getOptions } from './util';
import { start } from './services/start';

export default class ServiceBlend {
  options: Options;

  constructor(
    public config: Config,
    options: Partial<Options> = defaultOptions
  ) {
    this.options = getOptions(options);
  }

  async start(connections: Connections) {
    await start(connections, this.config, this.options);
  }
}

export * from './services';
export * from './types';
export * from './util';
