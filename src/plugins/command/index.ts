import Plugin, { PluginDeclaration } from '~/plugin';

export default class CommandPlugin extends Plugin<CommandPluginDeclaration> {
  static pluginName = 'command';

  async run() {
    console.log('running command');
  }
}

export interface CommandPluginDeclaration extends PluginDeclaration {}
