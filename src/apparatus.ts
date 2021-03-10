import { Proc } from 'pm2';
import { HashMap } from '~/types';
import { RunnerMode } from '~/runner';

export default abstract class Apparatus<Declaration = HashMap> {
  static apparatusName: string;

  protected env: HashMap<string> = {};

  protected declaration: Declaration;

  private _contexts: HashMap<ApparatusContext> = {};

  constructor(
    protected projectName: string,
    declaration: Partial<Declaration> = {}
  ) {
    this.declaration = { ...declaration } as Declaration;
  }

  protected registerContext(id: string, context: ApparatusContext) {
    this._contexts[id] = context;
  }

  protected getContext(id: string): ApparatusContext | void {
    return this._contexts[id];
  }

  async start(options: Partial<ApparatusStartOptions> = {}): Promise<any> {
    const startOptions: ApparatusStartOptions = {
      mode: RunnerMode.Foreground,
      ...options
    };
    return this.onStart(startOptions);
  }

  async stop(options: Partial<ApparatusStopOptions> = {}): Promise<any> {
    const stopOptions: ApparatusStopOptions = { ...options };
    return this.onStop(stopOptions);
  }

  abstract onStart(options?: ApparatusStartOptions): Promise<any>;

  abstract onStop(
    options?: ApparatusStopOptions,
    code?: string | number
  ): Promise<any>;
}

export interface ApparatusDeclaration {}

export interface ApparatusStartOptions {
  mode: RunnerMode;
}

export interface ApparatusStopOptions {}

export interface ApparatusContext {
  paths?: string[];
  proc?: Proc;
  [key: string]: any;
}
