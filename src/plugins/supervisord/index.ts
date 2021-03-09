import Plugin, { PluginDeclaration } from '~/plugin';

export default class SupervisordPlugin extends Plugin<SupervisordPluginDeclaration> {
  static pluginName = 'supervisord';

  async onRun() {
    console.log('running supervisord');
  }
}

export interface SupervisordPluginDeclaration extends PluginDeclaration {}
