import Plugin, { PluginDeclaration } from '~/plugin';

export default class ProxyPlugin extends Plugin<ProxyPluginDeclaration> {
  static pluginName = 'proxy';

  async onRun() {
    console.log('running proxy');
  }
}

export interface ProxyPluginDeclaration extends PluginDeclaration {}
