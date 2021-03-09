import Plugin, { PluginDeclaration } from '~/plugin';
import { HashMap } from '~/types';
import Command from './command';
import DockerCompose from './dockerCompose';
import Endpoint from './endpoint';
import Proxy from './proxy';
import Supervisord from './supervisord';

const plugins: HashMap<typeof Plugin> = ([
  Command,
  DockerCompose,
  Endpoint,
  Proxy,
  Supervisord
] as typeof Plugin[]).reduce(
  (plugins: HashMap<any>, PluginClass: typeof Plugin) => {
    plugins[PluginClass.pluginName] = PluginClass;
    return plugins;
  },
  {}
);

console.log('plugins', plugins);

export function getPlugin<P = Plugin, C = PluginDeclaration>(
  pluginName: string,
  pluginConfig: C
): P {
  const PluginClass = plugins[pluginName] as any;
  if (!PluginClass) {
    throw new Error(`plugin '${pluginName}' does not exist`);
  }
  return new PluginClass(pluginConfig) as P;
}

export { Command, DockerCompose, Endpoint, Proxy, Supervisord };
