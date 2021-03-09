import pm2, { Proc, StartOptions } from 'pm2';
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
      cwd: process.cwd(),
      projectName: '',
      ...options
    } as unknown) as Options;
    if (!((this.options as unknown) as CommandOptions).projectName.length) {
      const REGEX = /[^/]+$/g;
      const matches = ((this.options as unknown) as CommandOptions).cwd.match(
        REGEX
      );
      ((this.options as unknown) as CommandOptions).projectName = [
        ...(matches || [])
      ]?.[0];
    }
  }

  async start<T = any>(args: string | string[] = []): Promise<T> {
    const options = (this.options as unknown) as CommandOptions;
    await this._pm2Connect();
    await this._pm2Start(Array.isArray(args) ? args : [args], {
      cwd: options.cwd
    });
    return (null as unknown) as T;
  }

  async stop<T = any>(): Promise<T> {
    await this._pm2Connect();
    await this._pm2Stop();
    return (null as unknown) as T;
  }

  async delete<T = any>(): Promise<T> {
    await this._pm2Connect();
    await this._pm2Delete();
    return (null as unknown) as T;
  }

  async restart<T = any>(): Promise<T> {
    await this._pm2Connect();
    await this._pm2Restart();
    return (null as unknown) as T;
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
    return this._smartParse(await p) as T;
  }

  private _smartParse(result: ExecaReturnValue<string>): Result {
    try {
      return JSON.parse(result.stdout);
    } catch (err) {
      return result.stdout as string;
    }
  }

  private async _pm2Connect() {
    await new Promise((resolve, reject) => {
      pm2.connect((err: Error) => {
        if (err) return reject(err);
        return resolve(undefined);
      });
    });
  }

  private get _name() {
    const options = (this.options as unknown) as CommandOptions;
    return `${options.projectName}_${this.command}`;
  }

  private async _pm2Start(
    args: string[] = [],
    startOptions: StartOptions = {}
  ): Promise<Proc> {
    const script = `${this.command}${args.length ? ` ${args.join(' ')}` : ''}`;
    return new Promise((resolve, reject) => {
      pm2.start(
        {
          ...startOptions,
          name: this._name,
          script
        },
        (err: Error, proc: Proc) => {
          if (err) return reject(err);
          return resolve(proc);
        }
      );
    });
  }

  private async _pm2Stop(): Promise<Proc> {
    return new Promise((resolve, reject) => {
      pm2.stop(this._name, (err: Error, proc: Proc) => {
        if (err) return reject(err);
        return resolve(proc);
      });
    });
  }

  private async _pm2Delete(): Promise<Proc> {
    return new Promise((resolve, reject) => {
      pm2.delete(this._name, (err: Error, proc: Proc) => {
        if (err) return reject(err);
        return resolve(proc);
      });
    });
  }

  private async _pm2Restart(): Promise<Proc> {
    return new Promise((resolve, reject) => {
      pm2.restart(this._name, (err: Error, proc: Proc) => {
        if (err) return reject(err);
        return resolve(proc);
      });
    });
  }
}

export type Result = string | HashMap;

export interface CommandOptions {
  cwd: string;
  debug: boolean;
  projectName: string;
}

export type RunCallback = (p: ExecaChildProcess) => any;
