import ColorHash from 'color-hash';
import chalk from 'chalk';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
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

  constructor(options: Options) {
    const tmpPath = fs.mkdtempSync(`${os.tmpdir()}/`);
    this._paths = {
      stderr: path.resolve(tmpPath, 'stderr.log'),
      stdout: path.resolve(tmpPath, 'stdout.log'),
      tmp: tmpPath
    };
    this.options = ({
      debug: false,
      cwd: process.cwd(),
      ...options
    } as unknown) as Options;
    if (!((this.options as unknown) as RunnerOptions).projectName) {
      const REGEX = /[^/]+$/g;
      const matches = (
        ((this.options as unknown) as RunnerOptions)?.cwd || process.cwd()
      ).match(REGEX);
      ((this.options as unknown) as RunnerOptions).projectName = [
        ...(matches || [])
      ]?.[0];
    }
    const colorHash = new ColorHash({ lightness: 0.5 });
    this.color = colorHash.hex(
      ((this.options as unknown) as RunnerOptions).projectName || ''
    );
  }

  protected async pm2Start(
    args: string | string[] = [],
    options: Partial<RunnerStartOptions>,
    pm2StartOptions: Partial<Pm2StartOptions> = {},
    cb?: Pm2Callback
  ): Promise<ProcessDescription> {
    const { cwd } = (this.options as unknown) as RunnerOptions;
    const { mode }: RunnerStartOptions = {
      mode: RunnerMode.Foreground,
      ...options
    };
    await this._pm2Connect();
    if (mode !== RunnerMode.Detatched) await this._pm2Delete();
    const processDescriptionPromise = this._pm2Start(
      Array.isArray(args) ? args : [args],
      {
        cwd,
        ...pm2StartOptions
      },
      mode
    );
    if (mode !== RunnerMode.Detatched) await this._tail();
    const processDescription = await processDescriptionPromise;
    if (cb) cb(processDescription);
    if (mode !== RunnerMode.Detatched) await this._pm2Delete();
    await fs.remove(this._paths.tmp);
    this._pm2Disconnect();
    return processDescription;
  }

  protected async pm2Stop(): Promise<ProcessDescription | undefined> {
    await this._pm2Connect();
    if (!(await this.pm2Exits(true))) return undefined;
    const proc = await this._pm2Stop();
    this._pm2Disconnect();
    return proc;
  }

  protected async pm2Delete(): Promise<ProcessDescription | undefined> {
    await this._pm2Connect();
    if (!(await this.pm2Exits(true))) return undefined;
    const proc = await this._pm2Delete();
    this._pm2Disconnect();
    return proc;
  }

  protected async pm2Restart(): Promise<ProcessDescription> {
    await this._pm2Connect();
    const proc = await this._pm2Restart();
    this._pm2Disconnect();
    return proc;
  }

  protected async pm2Exits(connected = false): Promise<boolean> {
    if (!connected) await this._pm2Connect();
    const processDescription = await this._pm2Describe();
    if (!connected) this._pm2Disconnect();
    return !!processDescription;
  }

  protected async pm2Alive(connected = false): Promise<boolean> {
    if (!connected) await this._pm2Connect();
    const processDescription = await this._pm2Describe();
    if (!connected) this._pm2Disconnect();
    return (
      processDescription &&
      processDescription?.pm2_env?.status !== 'errored' &&
      processDescription?.pm2_env?.status !== 'stopped'
    );
  }

  private async _tail() {
    const options = (this.options as unknown) as RunnerOptions;
    const id = chalk.hex(this.color).bold(options.name);
    if (!(await fs.pathExists(this._paths.stderr))) {
      await fs.writeFile(this._paths.stderr, '');
    }
    if (!(await fs.pathExists(this._paths.stdout))) {
      await fs.writeFile(this._paths.stdout, '');
    }
    const tails: Tail[] = [];
    tails.push(
      this._tailFile(this._paths.stdout, (line: string) => {
        logger.info(`${id} | ${line}`);
      })
    );
    tails.push(
      this._tailFile(this._paths.stderr, (line: string) => {
        logger.error(`${id} | ${line}`);
      })
    );
    tails.forEach((tail: Tail) => tail.watch());
    await new Promise((r) => setTimeout(r, 1000));
    await new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          if (!(await this.pm2Alive(true))) {
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
  }

  private _tailFile(
    logPath: string,
    cb?: (line: string, lines: string[]) => any
  ): Tail {
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

  private async _pm2Connect() {
    await new Promise((resolve, reject) => {
      pm2.connect(false, (err: Error) => {
        if (err) return reject(err);
        return resolve(undefined);
      });
    });
  }

  private async _pm2Describe(): Promise<ProcessDescription> {
    return new Promise((resolve, reject) => {
      pm2.describe(
        this._name,
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
    return `${options.projectName}_${options.name}`.replace(/\s/g, '_');
  }

  private async _pm2Start(
    args: string[] = [],
    pm2StartOptions: Pm2StartOptions = {},
    mode = RunnerMode.Foreground
  ): Promise<ProcessDescription> {
    let { command } = this;
    let interpreter = 'sh';
    if (mode === RunnerMode.Foreground) {
      interpreter = 'node';
      const openTerminalPkgPath = require.resolve('open-terminal/package.json');
      const openTerminalPath = path.resolve(
        openTerminalPkgPath.substr(0, openTerminalPkgPath.length - 13),
        'bin/openTerminal.js'
      );
      command = openTerminalPath;
      args = [[this.command, ...args].join(' ')];
    }
    const startOptions = {
      ...pm2StartOptions,
      autorestart: false,
      args,
      instances: 1,
      interpreter,
      max_restarts: 1,
      merge_logs: true,
      name: this._name,
      script: command,
      ...(mode !== RunnerMode.Detatched
        ? {
            error: this._paths.stderr,
            output: this._paths.stdout
          }
        : {})
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
  cwd?: string;
  debug?: boolean;
  name: string;
  projectName?: string;
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
