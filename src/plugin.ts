import { HashMap } from '~/types';

export default abstract class Plugin<Declaration = HashMap> {
  static pluginName: string;

  protected env: HashMap<string> = {};

  protected declaration: Declaration;

  constructor(declaration: Partial<Declaration> = {}) {
    this.declaration = { ...declaration } as Declaration;
  }

  abstract run(): Promise<any>;

  async onStop(): Promise<any> {
    return undefined;
  }
}

export interface PluginDeclaration {}
