import { ProcessDescription } from 'pm2';
import Environment from '~/environment';
import { HashMap } from '~/types';
import { RunnerMode } from '~/runner';

export default abstract class Apparatus<Declaration = HashMap> {
  static apparatusName: string;

  protected env: HashMap<string> = {};

  protected declaration: Declaration;

  private _contexts: HashMap<ApparatusContext> = {};

  constructor(
    public environment: Environment,
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

  async stop(): Promise<any> {
    return this.onStop();
  }

  abstract onStart(options?: ApparatusStartOptions): Promise<any>;

  abstract onStop(code?: string | number): Promise<any>;
}

export interface ApparatusDeclaration {}

export interface ApparatusStartOptions {
  mode: RunnerMode;
}

export interface ApparatusContext {
  paths?: string[];
  processDescription?: ProcessDescription;
  [key: string]: any;
}
