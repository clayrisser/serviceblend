import path from 'path';
import DockerComposePlugin from '~/plugins/dockerCompose';
import Service from '~/service';
import { loadConfig, TConfig } from '~/config';

export default class ServiceBlend {
  options: ServiceBlendOptions;

  config?: TConfig;

  private _services: Service[] = [];

  constructor(options: Partial<ServiceBlendOptions> = {}) {
    this.options = {
      configPath: path.resolve('./serviceblend.yaml'),
      ...options
    };
    process.on('SIGINT', this.onStop.bind(this));
    process.on('SIGTERM', this.onStop.bind(this));
  }

  async run(serviceName: string, options: Partial<RunOptions> = {}) {
    const service = await this.getService(serviceName);
    this._services.push(service);
    return service.run(
      options.environmentName ||
        this.options.defaultEnvironmentName ||
        ((service.config.default as unknown) as string)
    );
  }

  async up(_options: Partial<UpOptions> = {}) {
    await this.getConfig();
    const dockerComposePlugin = new DockerComposePlugin();
    await dockerComposePlugin.run();
  }

  async getConfig(): Promise<TConfig> {
    if (this.config) return this.config;
    return this._loadConfig();
  }

  async getService(serviceName: string): Promise<Service> {
    const config = await this.getConfig();
    const serviceConfig = config.services[serviceName];
    if (!serviceConfig) {
      throw new Error(`service '${serviceName}' does not exists`);
    }
    return new Service(serviceConfig);
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
  environmentName?: string;
}

export interface UpOptions {}

export interface ServiceBlendOptions {
  config?: TConfig;
  configPath: string;
  defaultEnvironmentName?: string;
}
