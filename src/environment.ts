import { Environment as EnvironmentConfig } from '~/config';
import { getApparatus } from '~/apparatuses';
import Apparatus from '~/apparatus';
import { RunnerMode } from './runner';

export default class Environment {
  protected apparatus: Apparatus;

  constructor(public projectName: string, public config: EnvironmentConfig) {
    this.apparatus = getApparatus(
      projectName,
      (config.apparatus as unknown) as string,
      config.definition
    );
  }

  async run(options: Partial<EnvironmentRunOptions> = {}) {
    const { mode } = {
      mode: RunnerMode.Foreground,
      ...options
    };
    return this.apparatus.start({ mode });
  }

  async stop(_options: Partial<EnvironmentStopOptions> = {}) {
    return this.apparatus.stop();
  }

  async onStop(code?: string | number) {
    await this.apparatus.onStop({}, code);
  }
}

export interface EnvironmentRunOptions {
  mode: RunnerMode;
}

export interface EnvironmentStopOptions {}
