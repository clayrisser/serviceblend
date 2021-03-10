import ColorHash from 'color-hash';
import chalk from 'chalk';
import pm2, { Proc, StartOptions as Pm2StartOptions } from 'pm2';
import { Tail } from 'tail';
import { HashMap } from '~/types';

const logger = console;

export default abstract class Runner<Options = RunnerOptions> {
  protected options: Options;

  protected abstract command: string;

  protected color: string;

  constructor(options: Partial<Options> = {}) {
    this.options = ({
      debug: false,
      cwd: process.cwd(),
      projectName: '',
      ...options
    } as unknown) as Options;
    if (!((this.options as unknown) as RunnerOptions).projectName.length) {
      const REGEX = /[^/]+$/g;
      const matches = ((this.options as unknown) as RunnerOptions).cwd.match(
        REGEX
      );
      ((this.options as unknown) as RunnerOptions).projectName = [
        ...(matches || [])
      ]?.[0];
    }
    const colorHash = new ColorHash({ lightness: 0.5 });
    this.color = colorHash.hex(
      ((this.options as unknown) as RunnerOptions).projectName
    );
  }

  async start(
    args: string | string[] = [],
    options: Partial<RunnerStartOptions>,
    pm2StartOptions: Partial<Pm2StartOptions> = {},
    cb?: Pm2Callback
  ): Promise<Proc> {
    const { cwd, projectName } = (this.options as unknown) as RunnerOptions;
    const { mode }: RunnerStartOptions = {
      mode: RunnerMode.Foreground,
      ...options
    };
    await this._pm2Connect();
    const proc = await this._pm2Start(Array.isArray(args) ? args : [args], {
      cwd,
      ...pm2StartOptions
    });
    if (cb) cb(proc);
    const id = chalk.hex(this.color).bold(`${projectName} ${this.command}`);
    if (mode === RunnerMode.Foreground) {
      if (proc.pm_out_log_path) {
        this.tail(proc.pm_out_log_path, (line: string) => {
          logger.info(`${id} | ${line}`);
        });
      }
      if (proc.pm_err_log_path) {
        this.tail(proc.pm_err_log_path, (line: string) => {
          logger.error(`${id} | ${line}`);
        });
      }
    }
    setInterval(() => {
      console.log(proc);
    }, 1000);
    this._pm2Disconnect();
    return proc;
  }

  tail(logPath: string, cb?: (line: string, lines: string[]) => any): Tail {
    const lines: string[] = [];
    const tail = new Tail(logPath);
    tail.on('line', (data: any) => {
      const line = data.toString;
      lines.push(line);
      if (cb) cb(line, lines);
    });
    tail.on('error', (err: Error) => {
      throw err;
    });
    return tail;
  }

  async stop(): Promise<Proc> {
    await this._pm2Connect();
    const proc = await this._pm2Stop();
    this._pm2Disconnect();
    return proc;
  }

  async delete(): Promise<Proc> {
    await this._pm2Connect();
    const proc = await this._pm2Delete();
    this._pm2Disconnect();
    return proc;
  }

  async restart(): Promise<Proc> {
    await this._pm2Connect();
    const proc = await this._pm2Restart();
    this._pm2Disconnect();
    return proc;
  }

  private async _pm2Connect() {
    await new Promise((resolve, reject) => {
      pm2.connect(false, (err: Error) => {
        if (err) return reject(err);
        return resolve(undefined);
      });
    });
  }

  private _pm2Disconnect() {
    pm2.disconnect();
  }

  private get _name() {
    const options = (this.options as unknown) as RunnerOptions;
    return `${options.projectName}_${this.command}`;
  }

  private async _pm2Start(
    args: string[] = [],
    pm2StartOptions: Pm2StartOptions = {}
  ): Promise<Proc> {
    return new Promise((resolve, reject) => {
      pm2.start(
        {
          ...pm2StartOptions,
          args,
          instances: 1,
          interpreter: 'sh',
          name: this._name,
          script: this.command
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

export interface RunnerOptions {
  cwd: string;
  debug: boolean;
  projectName: string;
}

export type Pm2Callback = (proc: Proc) => any;

export interface RunnerStartOptions {
  mode: RunnerMode;
}

export enum RunnerMode {
  Detatched = 'DETATCHED',
  Foreground = 'FOREGROUND',
  Terminal = 'TERMINAL'
}
