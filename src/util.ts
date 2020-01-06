import path from 'path';
import pkgDir from 'pkg-dir';
import { cosmiconfig } from 'cosmiconfig';
import defaultOptions from './defaultOptions';
import { Config, Connections, Options } from './types';

export function parseConnectionsString(
  connectionsString: string,
  _options: Options = defaultOptions
): Connections {
  return connectionsString
    .split(',')
    .reduce((connections: Connections, connectionString: string) => {
      const connectionMap = connectionString.split(':');
      if (connectionMap.length < 2) {
        throw new Error(
          'service must map to environment (e.g. service:environment)'
        );
      }
      const [serviceName, environmentName] = connectionMap;
      connections[serviceName] = environmentName;
      return connections;
    }, {});
}

export async function getConfig(
  options: Options = defaultOptions
): Promise<Config> {
  const rootPath = options.rootPath
    ? path.resolve(process.cwd(), options.rootPath)
    : (await pkgDir(process.cwd())) || process.cwd();
  let config: Config;
  try {
    const payload = await cosmiconfig('serviceblend').search(rootPath);
    config = (payload && payload.config ? payload.config : {}) as Config;
  } catch (err) {
    if (err.name !== 'YAMLException') throw err;
    // eslint-disable-next-line import/no-dynamic-require,global-require,no-eval
    config = eval(`require(${err.mark.name})`);
  }
  return config;
}
