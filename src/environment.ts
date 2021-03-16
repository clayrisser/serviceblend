import open from 'open';
import Apparatus from '~/apparatus';
import Service from '~/service';
import { Environment as EnvironmentConfig } from '~/config';
import { getApparatus } from '~/apparatuses';
import { RunnerMode } from './runner';

export default class Environment {
  protected apparatus: Apparatus;

  constructor(
    public service: Service,
    public environmentName: string,
    public config: EnvironmentConfig
  ) {
    this.apparatus = getApparatus(
      this,
      (config.apparatus as unknown) as string,
      config.definition
    );
  }

  async run(options: Partial<EnvironmentRunOptions> = {}) {
    const { mode } = {
      mode: RunnerMode.Foreground,
      ...options
    };
    return this.apparatus.start({ mode }, () => {
      if (this.config.endpoint && options.open) open(this.config.endpoint);
    });
  }

  async stop(_options: Partial<EnvironmentStopOptions> = {}) {
    return this.apparatus.stop();
  }

  async onStop(code?: string | number) {
    await this.apparatus.onStop(code);
  }
}

export interface EnvironmentRunOptions {
  mode: RunnerMode;
  open?: boolean;
}

export interface EnvironmentStopOptions {}
