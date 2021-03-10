import { StartOptions as Pm2StartOptions } from 'pm2';
import Runner, { RunnerMode, Pm2Callback, RunnerOptions } from '~/runner';

export default class DockerCompose extends Runner<DockerComposeOptions> {
  command = 'docker-compose';

  constructor(options: Partial<DockerComposeOptions> = {}) {
    super({ ...options });
  }

  async help(pm2StartOptions?: Pm2StartOptions, cb?: Pm2Callback) {
    return this.start(
      ['--help'],
      { mode: RunnerMode.Foreground },
      {
        cwd: this.options.cwd,
        ...pm2StartOptions
      },
      cb
    );
  }

  async run(
    options: Partial<RunOptions> = {},
    pm2StartOptions?: Pm2StartOptions,
    cb?: Pm2Callback
  ) {
    const { detatch, serviceName }: RunOptions = {
      detatch: false,
      serviceName: '',
      ...options
    };
    const args = [
      ...(this.options.file ? ['-f', this.options.file] : []),
      'run',
      ...(detatch ? ['-d'] : []),
      '--',
      serviceName || ''
    ];
    return this.start(
      args,
      {},
      {
        cwd: this.options.cwd,
        ...pm2StartOptions
      },
      cb
    );
  }
}

export interface DockerComposeOptions extends RunnerOptions {
  file?: string;
}

export interface DownOptions {}

export interface UpOptions {
  detatch: boolean;
}

export interface RunOptions {
  serviceName: string;
  detatch: boolean;
}
