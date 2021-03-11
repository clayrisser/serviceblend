import path from 'path';
import Service from '~/service';
import { RunnerMode } from '~/runner';
import { loadConfig, Config } from '~/config';
import { HashMap } from '~/types';

export default class ServiceBlend {
  options: ServiceBlendOptions;

  config: Config;

  private _services: HashMap<Service> = {};

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
    this.config = this.options.config || loadConfig(this.options.configPath);
    this._services = Object.keys(this.config.services).reduce(
      (services: HashMap<Service>, serviceName: string) => {
        services[serviceName] = this.getService(
          this.options.projectName,
          serviceName
        );
        return services;
      },
      {}
    );
    process.on('SIGINT', (code: string | number) => this.onStop(code));
    process.on('SIGTERM', (code: string | number) => this.onStop(code));
  }

  async run(
    serviceName: string,
    options: Partial<ServiceBlendRunOptions> = {}
  ) {
    const runOptions: ServiceBlendRunOptions = {
      mode: RunnerMode.Foreground,
      ...options
    };
    const service = this._services[serviceName];
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
    const service = this._services[serviceName];
    return service.stop(
      stopOptions.environmentName ||
        this.options.defaultEnvironmentName ||
        service.config.default ||
        Object.keys(service.config.environments)?.[0],
      stopOptions
    );
  }

  getService(projectName: string, serviceName: string): Service {
    const serviceConfig = this.config.services[serviceName];
    if (!serviceConfig) {
      throw new Error(`service '${serviceName}' does not exists`);
    }
    return new Service(this, projectName, serviceName, serviceConfig);
  }

  async onStop(code?: string | number, timeout = 5000) {
    const t = setTimeout(() => {
      process.exit();
    }, timeout);
    await Promise.all(
      Object.values(this._services).map(async (service: Service) => {
        await service.onStop(code);
      })
    );
    clearTimeout(t);
    process.exit();
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
