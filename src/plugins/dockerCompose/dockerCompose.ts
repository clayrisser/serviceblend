import { ExecaChildProcess, Options as ExecaOptions } from 'execa';
import { Readable } from 'stream';
import Command, { CommandOptions, RunCallback } from '~/command';

export default class DockerCompose extends Command<DockerComposeOptions> {
  command = 'docker-compose';

  constructor(options: Partial<DockerComposeOptions> = {}) {
    super({
      cwd: process.cwd(),
      ...options
    });
  }

  async help(options?: ExecaOptions, cb?: RunCallback) {
    return this.run('--help', options, cb);
  }

  async up(
    upOptions: Partial<UpOptions> = {},
    options?: ExecaOptions,
    cb?: RunCallback
  ): Promise<string> {
    const { detatch, stdout, stdin } = {
      detatch: false,
      stdout: true,
      ...upOptions
    };
    return this.run(
      [
        ...(this.options.file ? ['-f', this.options.file] : []),
        'up',
        ...(detatch ? ['-d'] : [])
      ],
      {
        cwd: this.options.cwd,
        ...options
      },
      (p: ExecaChildProcess) => {
        if (stdin) {
          const stream = Readable.from([stdin]);
          if (p.stdin) stream.pipe(p.stdin);
        }
        if (stdout) {
          p.stderr?.pipe(process.stderr);
          p.stdout?.pipe(process.stdout);
        }
        if (cb) cb(p);
      }
    );
  }

  async down(
    downOptions: Partial<DownOptions> = {},
    options?: ExecaOptions,
    cb?: RunCallback
  ): Promise<string> {
    const { stdout, stdin } = {
      stdout: true,
      ...downOptions
    };
    return this.run(
      [...(this.options.file ? ['-f', this.options.file] : []), 'down'],
      {
        cwd: this.options.cwd,
        ...options
      },
      (p: ExecaChildProcess) => {
        if (stdin) {
          const stream = Readable.from([stdin]);
          if (p.stdin) stream.pipe(p.stdin);
        }
        if (stdout) {
          p.stderr?.pipe(process.stderr);
          p.stdout?.pipe(process.stdout);
        }
        if (cb) cb(p);
      }
    );
  }
}

export interface DockerComposeOptions extends CommandOptions {
  cwd: string;
  file?: string;
}

export interface DownOptions {
  stdin?: string;
  stdout: boolean;
}

export interface UpOptions {
  detatch: boolean;
  stdin?: string;
  stdout: boolean;
}

export enum Output {
  Yaml = 'yaml',
  Json = 'json'
}
