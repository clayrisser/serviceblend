import defaultOptions from './defaultOptions';
import { Connections, Options } from './types';

export default class ServiceBlend {
  constructor(public options: Options = defaultOptions) {}

  async start(connections: Connections) {
    console.log('connections', connections);
    return connections;
  }
}

export * from './types';
export * from './util';
