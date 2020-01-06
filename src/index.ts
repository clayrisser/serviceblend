import defaultOptions from './defaultOptions';
import { Config, Connections, Options } from './types';

export default class ServiceBlend {
  constructor(
    public config: Config,
    public options: Options = defaultOptions
  ) {}

  async start(connections: Connections) {
    console.log('config', this.config);
    console.log('connections', connections);
    return connections;
  }
}

export * from './types';
export * from './util';
