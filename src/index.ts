import defaultOptions from './defaultOptions';
import start from './services/start';
import { Config, Connections, Options } from './types';

export default class ServiceBlend {
  constructor(
    public config: Config,
    public options: Options = defaultOptions
  ) {}

  async start(connections: Connections) {
    await start(connections, this.config, this.options);
  }
}

export * from './types';
export * from './util';
