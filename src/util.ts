import { Connections } from './types';

export function parseConnectionsString(connectionsString: string): Connections {
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
