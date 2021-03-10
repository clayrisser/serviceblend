import path from 'path';
import Service from '~/service';
import { RunnerMode } from '~/runner';
import { loadConfig, Config } from '~/config';

export default class ServiceBlend {
  options: ServiceBlendOptions;

  config?: Config;

  private _services: Service[] = [];

  constructor(options: Partial<ServiceBlendOptions> = {}) {
    this.options = {
      configPath: path.resolve('./serviceblend.yaml'),
      cwd: process.cwd(),
      projectName: '',
      ...options
    };
    if (!this.options.projectName.length) {
      const REGEX = /[^/]+$/g;
      const matches = this.options.cwd.match(REGEX);
      this.options.projectName = [...(matches || [])]?.[0];
    }
    process.on('SIGINT', this.onStop.bind(this));
    process.on('SIGTERM', this.onStop.bind(this));
  }

  async run(
    serviceName: string,
    options: Partial<ServiceBlendRunOptions> = {}
  ) {
    const runOptions: ServiceBlendRunOptions = {
      mode: RunnerMode.Foreground,
      ...options
    };
    const service = await this.getService(
      this.options.projectName,
      serviceName
    );
    this._services.push(service);
    return service.run(
      runOptions.environmentName ||
        this.options.defaultEnvironmentName ||
        service.config.default ||
        Object.keys(service.config.environments)?.[0],
      runOptions
    );
  }

  async stop(
    serviceName: string,
    options: Partial<ServiceBlendStopOptions> = {}
  ) {
    const stopOptions: ServiceBlendStopOptions = { ...options };
    const service = await this.getService(
      this.options.projectName,
      serviceName
    );
    this._services.push(service);
    return service.stop(
      stopOptions.environmentName ||
        this.options.defaultEnvironmentName ||
        service.config.default ||
        Object.keys(service.config.environments)?.[0],
      stopOptions
    );
  }

  async getConfig(): Promise<Config> {
    if (this.config) return this.config;
    return this._loadConfig();
  }

  async getService(projectName: string, serviceName: string): Promise<Service> {
    const config = await this.getConfig();
    const serviceConfig = config.services[serviceName];
    if (!serviceConfig) {
      throw new Error(`service '${serviceName}' does not exists`);
    }
    return new Service(projectName, serviceConfig);
  }

  private async _loadConfig(): Promise<Config> {
    this.config =
      this.options.config || (await loadConfig(this.options.configPath));
    return this.config;
  }

  async onStop() {
    await Promise.all(
      this._services.map(async (service: Service) => {
        await service.onStop();
      })
    );
  }
}

export interface ServiceBlendStopOptions {
  environmentName?: string;
}

export interface ServiceBlendRunOptions {
  mode: RunnerMode;
  environmentName?: string;
}

export interface ServiceBlendOptions {
  config?: Config;
  configPath: string;
  cwd: string;
  defaultEnvironmentName?: string;
  projectName: string;
}

export * from '~/environment';
export * from '~/runner';
export * from '~/service';
export * from '~/types';
