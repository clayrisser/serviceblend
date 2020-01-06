import glob from 'glob';
import path from 'path';
import pkgDir from 'pkg-dir';
import { cosmiconfig } from 'cosmiconfig';
import { mapSeries } from 'bluebird';
import defaultConfig from './defaultConfig';
import defaultOptions from './defaultOptions';
import { Config, Connections, Options, Service } from './types';

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

export async function getPartialConfig(
  configPath: string,
  _options: Options = defaultOptions
): Promise<Config> {
  let config: Config;
  try {
    const payload = await cosmiconfig('serviceblend').load(configPath);
    config = (payload && payload.config ? payload.config : {}) as Config;
  } catch (err) {
    if (err.name !== 'YAMLException') throw err;
    // eslint-disable-next-line import/no-dynamic-require,global-require,no-eval
    config = eval(`require(${err.mark.name})`);
  }
  return config;
}

export async function getConfig(
  options: Options = defaultOptions
): Promise<Config> {
  const rootPath = options.rootPath
    ? path.resolve(process.cwd(), options.rootPath)
    : (await pkgDir(process.cwd())) || process.cwd();
  const matches = await new Promise<string[]>((resolve, reject) => {
    glob(
      '**/.serviceblendrc{,.js,.json,.yml,.yaml}',
      { cwd: rootPath, ignore: 'node_modules/**/*' },
      (err: Error | null, matches: string[]) => {
        if (err) return reject(err);
        return resolve(matches);
      }
    );
  });
  return (
    await mapSeries(matches, async (match: string) => {
      return getPartialConfig(path.resolve(rootPath, match), options);
    })
  ).reduce((config: Config, partialConfig: Partial<Config>) => {
    Object.entries(partialConfig.services || {}).forEach(
      ([serviceName, service]: [string, Service]) => {
        config.services[serviceName] = service;
      }
    );
    return config;
  }, defaultConfig);
}
