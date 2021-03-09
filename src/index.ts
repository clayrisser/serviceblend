import path from 'path';
import Service from '~/service';
import { loadConfig, TConfig } from '~/config';

export default class ServiceBlend {
  options: ServiceBlendOptions;

  config?: TConfig;

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

  async run(serviceName: string, options: Partial<RunOptions> = {}) {
    const service = await this.getService(
      this.options.projectName,
      serviceName
    );
    this._services.push(service);
    return service.run(
      options.environmentName ||
        this.options.defaultEnvironmentName ||
        ((service.config.default as unknown) as string),
      {
        ...(typeof options.daemon === 'undefined'
          ? {}
          : { daemon: options.daemon })
      }
    );
  }

  async getConfig(): Promise<TConfig> {
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

  private async _loadConfig(): Promise<TConfig> {
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

export interface RunOptions {
  daemon?: boolean;
  environmentName?: string;
}

export interface UpOptions {}

export interface ServiceBlendOptions {
  config?: TConfig;
  configPath: string;
  cwd: string;
  defaultEnvironmentName?: string;
  projectName: string;
}
