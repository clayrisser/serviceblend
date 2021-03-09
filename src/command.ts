import execa, {
  ExecaChildProcess,
  ExecaReturnValue,
  Options as ExecaOptions
} from 'execa';
import { HashMap } from '~/types';

const logger = console;

export default abstract class Command<Options = CommandOptions> {
  protected options: Options;

  protected abstract command: string;

  protected execa = execa;

  constructor(options: Partial<Options> = {}) {
    this.options = ({
      debug: false,
      ...options
    } as unknown) as Options;
  }

  async execute<T = Result>(
    args: string | string[] = [],
    options: ExecaOptions = {},
    cb: RunCallback = (p: ExecaChildProcess) => {
      p.stderr?.pipe(process.stderr);
      p.stdout?.pipe(process.stdout);
    }
  ): Promise<T> {
    if (((this.options as unknown) as CommandOptions).debug) {
      logger.debug('$', [this.command, ...args].join(' '));
    }
    if (!Array.isArray(args)) args = [args];
    const p = execa(this.command, args, options);
    cb(p);
    return this.smartParse(await p) as T;
  }

  smartParse(result: ExecaReturnValue<string>): Result {
    try {
      return JSON.parse(result.stdout);
    } catch (err) {
      return result.stdout as string;
    }
  }
}

export type Result = string | HashMap;

export interface CommandOptions {
  debug: boolean;
}

export type RunCallback = (p: ExecaChildProcess) => any;
