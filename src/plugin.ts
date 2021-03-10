import { ExecaChildProcess } from 'execa';
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

  async stop(_options: Partial<PluginStopOptions> = {}): Promise<any> {}

  abstract onRun(): Promise<any>;
}

export interface PluginDeclaration {}

export interface PluginRunOptions {
  daemon: boolean;
}

export interface PluginStopOptions {
  daemon: boolean;
}

export interface PluginContext {
  p: ExecaChildProcess;
  tmpPath?: string;
}
