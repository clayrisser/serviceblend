import Plugin, { PluginDeclaration } from '~/plugin';

export default class ProxyPlugin extends Plugin<ProxyPluginDeclaration> {
  static pluginName = 'proxy';

  async run() {
    console.log('running proxy');
  }
}

export interface ProxyPluginDeclaration extends PluginDeclaration {}
