import { StartOptions as Pm2StartOptions } from 'pm2';
import Runner, { RunnerMode, Pm2Callback, RunnerOptions } from '~/runner';

export default class DockerCompose extends Runner<DockerComposeOptions> {
  command = 'docker-compose';

  constructor(options: DockerComposeOptions) {
    super({ ...options });
  }

  async help(pm2StartOptions?: Pm2StartOptions, cb?: Pm2Callback) {
    return this.pm2Start(
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
    options: Partial<DockerComposeRunOptions> = {},
    pm2StartOptions?: Pm2StartOptions,
    cb?: Pm2Callback
  ) {
    const { mode, serviceName }: DockerComposeRunOptions = {
      mode: RunnerMode.Foreground,
      serviceName: '',
      ...options
    };
    const args = [
      ...(this.options.file ? ['-f', this.options.file] : []),
      'run',
      '--',
      serviceName || ''
    ];
    return this.pm2Start(
      args,
      { mode },
      {
        cwd: this.options.cwd,
        ...pm2StartOptions
      },
      cb
    );
  }

  async stop(
    options: Partial<DockerComposeStopOptions> = {},
    pm2StartOptions?: Pm2StartOptions,
    cb?: Pm2Callback
  ) {
    const { serviceName }: DockerComposeStopOptions = {
      serviceName: '',
      ...options
    };
    const args = [
      ...(this.options.file ? ['-f', this.options.file] : []),
      'stop',
      '--',
      serviceName || ''
    ];
    return this.pm2Start(
      args,
      { mode: RunnerMode.Foreground },
      {
        cwd: this.options.cwd,
        ...pm2StartOptions
      },
      cb
    );
  }

  async onStop(_code?: string | number) {
    await this.pm2Stop();
    return this.pm2Delete();
  }
}

export interface DockerComposeOptions extends RunnerOptions {
  file?: string;
}

export interface DockerComposeRunOptions {
  serviceName: string;
  mode: RunnerMode;
}

export interface DockerComposeStopOptions {
  serviceName: string;
}
