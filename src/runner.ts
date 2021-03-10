import ColorHash from 'color-hash';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import os from 'os';
import { Tail } from 'tail';
import pm2, {
  ProcessDescription,
  StartOptions as Pm2StartOptions,
  Proc
} from 'pm2';

const logger = console;

export default abstract class Runner<Options = RunnerOptions> {
  protected options: Options;

  protected abstract command: string;

  protected color: string;

  private _paths: RunnerPaths;

  constructor(options: Partial<Options> = {}) {
    const tmpPath = fs.mkdtempSync(`${os.tmpdir()}/`);
    this._paths = {
      stderr: path.resolve(tmpPath, 'stderr.log'),
      stdout: path.resolve(tmpPath, 'stdout.log'),
      tmp: tmpPath
    };
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
  ): Promise<ProcessDescription> {
    const { cwd, projectName } = (this.options as unknown) as RunnerOptions;
    const { mode }: RunnerStartOptions = {
      mode: RunnerMode.Foreground,
      ...options
    };
    await this._pm2Connect();
    const processDescription = await this._pm2Start(
      Array.isArray(args) ? args : [args],
      {
        cwd,
        ...pm2StartOptions
      }
    );
    if (cb) cb(processDescription);
    if (mode === RunnerMode.Foreground) {
      const id = chalk.hex(this.color).bold(`${projectName} ${this.command}`);
      if (!(await fs.pathExists(this._paths.stderr))) {
        await fs.writeFile(this._paths.stderr, '');
      }
      if (!(await fs.pathExists(this._paths.stdout))) {
        await fs.writeFile(this._paths.stdout, '');
      }
      const tails: Tail[] = [];
      tails.push(
        this.tail(this._paths.stdout, (line: string) => {
          logger.info(`${id} | ${line}`);
        })
      );
      tails.push(
        this.tail(this._paths.stderr, (line: string) => {
          logger.error(`${id} | ${line}`);
        })
      );
      tails.forEach((tail: Tail) => tail.watch());
      await new Promise((r) => setTimeout(r, 1000));
      await new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const processDescription = await this._pm2Describe(this._name);
            if (
              !processDescription ||
              (processDescription?.pm2_env?.status !== 'online' &&
                processDescription?.pm2_env?.status !== 'launching')
            ) {
              clearInterval(interval);
              tails.forEach((tail: Tail) => tail.unwatch());
              return resolve(undefined);
            }
          } catch (err) {
            return reject(err);
          }
          return null;
        }, 1000);
      });
      await this._pm2Delete();
    }
    await fs.remove(this._paths.tmp);
    this._pm2Disconnect();
    return processDescription;
  }

  tail(logPath: string, cb?: (line: string, lines: string[]) => any): Tail {
    const lines: string[] = [];
    const tail = new Tail(logPath);
    tail.on('line', (data: any) => {
      const line = data.toString();
      lines.push(line);
      if (cb) cb(line, lines);
    });
    tail.on('error', (err: Error) => {
      throw err;
    });
    return tail;
  }

  async stop(): Promise<ProcessDescription> {
    await this._pm2Connect();
    const proc = await this._pm2Stop();
    this._pm2Disconnect();
    return proc;
  }

  async delete(): Promise<ProcessDescription> {
    await this._pm2Connect();
    const proc = await this._pm2Delete();
    this._pm2Disconnect();
    return proc;
  }

  async restart(): Promise<ProcessDescription> {
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

  private async _pm2Describe(
    process: string | number
  ): Promise<ProcessDescription> {
    return new Promise((resolve, reject) => {
      pm2.describe(
        process,
        (err: Error, processDescriptions: ProcessDescription[]) => {
          if (err) return reject(err);
          return resolve(
            Array.isArray(processDescriptions)
              ? processDescriptions?.[0]
              : (processDescriptions as ProcessDescription)
          );
        }
      );
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
  ): Promise<ProcessDescription> {
    const startOptions = {
      ...pm2StartOptions,
      autorestart: false,
      args,
      error: this._paths.stderr,
      instances: 1,
      interpreter: 'sh',
      max_restarts: 1,
      merge_logs: true,
      name: this._name,
      output: this._paths.stdout,
      script: this.command
    };
    return new Promise((resolve, reject) => {
      pm2.start(startOptions, (err: Error, proc: Proc) => {
        const processDescriptions = proc as ProcessDescription[];
        if (err) return reject(err);
        return resolve(
          Array.isArray(processDescriptions)
            ? processDescriptions?.[0]
            : (processDescriptions as ProcessDescription)
        );
      });
    });
  }

  private async _pm2Stop(): Promise<ProcessDescription> {
    return new Promise((resolve, reject) => {
      pm2.stop(this._name, (err: Error, proc: ProcessDescription) => {
        if (err) return reject(err);
        return resolve(proc);
      });
    });
  }

  private async _pm2Delete(): Promise<ProcessDescription> {
    return new Promise((resolve, reject) => {
      pm2.delete(this._name, (err: Error, proc: ProcessDescription) => {
        if (err) return reject(err);
        return resolve(proc);
      });
    });
  }

  private async _pm2Restart(): Promise<ProcessDescription> {
    return new Promise((resolve, reject) => {
      pm2.restart(this._name, (err: Error, proc: ProcessDescription) => {
        if (err) return reject(err);
        return resolve(proc);
      });
    });
  }
}

export interface RunnerOptions {
  cwd: string;
  debug: boolean;
  projectName: string;
}

export type Pm2Callback = (processDescription: ProcessDescription) => any;

export interface RunnerStartOptions {
  mode: RunnerMode;
}

export enum RunnerMode {
  Detatched = 'DETATCHED',
  Foreground = 'FOREGROUND',
  Terminal = 'TERMINAL'
}

export interface RunnerPaths {
  stderr: string;
  stdout: string;
  tmp: string;
}
