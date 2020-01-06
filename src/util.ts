import path from 'path';
import pkgDir from 'pkg-dir';
import defaultOptions from './defaultOptions';
import { Connections, Options } from './types';

export function parseConnectionsString(
  connectionsString: string,
  _options: Options = defaultOptions
): [string | null, Connections] {
  let defaultConnection: string | null = null;
  const connections = connectionsString
    .split(',')
    .reduce((connections: Connections, connectionString: string, i: number) => {
      const connectionMap = connectionString.split(':');
      if (connectionMap.length < 2) {
        if (i > 0) {
          throw new Error(
            'all connections except the first are required to map a service to an environment (e.g. service:environment)'
          );
        }
        const [environmentName] = connectionMap;
        defaultConnection = environmentName;
      } else {
        const [environmentName, serviceName] = connectionMap;
        connections[environmentName] = serviceName;
      }
      return connections;
    }, {});
  return [defaultConnection, connections];
}

export function getOptions(options: Partial<Options>): Options {
  return {
    ...options,
    rootPath: options.rootPath
      ? path.resolve(process.cwd(), options.rootPath)
      : pkgDir.sync(process.cwd()) || process.cwd()
  };
}
