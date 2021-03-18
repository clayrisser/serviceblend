import { StartOptions as Pm2StartOptions } from 'pm2';
import Runner, { RunnerMode, Pm2Callback, RunnerOptions } from '~/runner';

export default class Sh extends Runner<ShOptions> {
  constructor(options: ShOptions) {
    super({ ...options });
  }

  async run(
    options: Partial<ShRunOptions> = {},
    pm2StartOptions?: Pm2StartOptions,
    cb?: Pm2Callback
  ) {
    const { mode, command }: ShRunOptions = {
      command: 'true',
      mode: RunnerMode.Foreground,
      ...options
    };
    await this.pm2Start(
      command,
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
    this.pm2Disconnect();
  }
}

export interface ShOptions extends RunnerOptions {}

export interface ShRunOptions {
  command: string;
  mode: RunnerMode;
}
