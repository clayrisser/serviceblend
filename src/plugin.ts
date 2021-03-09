import { HashMap } from '~/types';

export default abstract class Plugin<Declaration = HashMap> {
  static pluginName: string;

  protected env: HashMap<string> = {};

  protected declaration: Declaration;

  constructor(
    protected projectName: string,
    declaration: Partial<Declaration> = {}
  ) {
    this.declaration = { ...declaration } as Declaration;
  }

  async run(options: Partial<PluginRunOptions> = {}): Promise<any> {
    const { daemon } = {
      daemon: false,
      ...options
    };
    return this.onRun();
  }

  abstract onRun(): Promise<any>;

  async onStop(): Promise<any> {
    return undefined;
  }
}

export interface PluginDeclaration {}

export interface PluginRunOptions {
  daemon: boolean;
}
