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
    const { mode, serviceName, daemon }: DockerComposeRunOptions = {
      daemon: false,
      mode: RunnerMode.Foreground,
      serviceName: '',
      ...options
    };
    const args = [
      ...(daemon ? ['-d'] : []),
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

  async up(
    options: Partial<DockerComposeUpOptions> = {},
    pm2StartOptions?: Pm2StartOptions,
    cb?: Pm2Callback
  ) {
    const { daemon, mode }: DockerComposeUpOptions = {
      daemon: false,
      mode: RunnerMode.Foreground,
      ...options
    };
    const args = [
      ...(daemon ? ['-d'] : []),
      ...(this.options.file ? ['-f', this.options.file] : []),
      'up'
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

  async down(
    options: Partial<DockerComposeDownOptions> = {},
    pm2StartOptions?: Pm2StartOptions,
    cb?: Pm2Callback
  ) {
    const { mode }: DockerComposeDownOptions = {
      mode: RunnerMode.Foreground,
      ...options
    };
    const args = [
      ...(this.options.file ? ['-f', this.options.file] : []),
      'down'
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

  async onStop(_code?: string | number) {
    await this.pm2Stop();
    await this.pm2Delete();
  }
}

export interface DockerComposeOptions extends RunnerOptions {
  file?: string;
}

export interface DockerComposeRunOptions {
  daemon: boolean;
  mode: RunnerMode;
  serviceName: string;
}

export interface DockerComposeUpOptions {
  daemon: boolean;
  mode: RunnerMode;
}

export interface DockerComposeDownOptions {
  mode: RunnerMode;
}

export interface DockerComposeStopOptions {
  serviceName: string;
}
