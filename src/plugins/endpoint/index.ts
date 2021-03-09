import Plugin, { PluginDeclaration } from '~/plugin';

export default class EndpointPlugin extends Plugin<EndpointPluginDeclaration> {
  static pluginName = 'endpoint';

  async run() {
    console.log('running endpoint');
  }
}

export interface EndpointPluginDeclaration extends PluginDeclaration {}
