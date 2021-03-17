import path from 'path';
import Service from '~/service';
import { RunnerMode } from '~/runner';
import { ConfigLoader, Config } from '~/config';
import { HashMap } from '~/types';

export default class ServiceBlend {
  options: ServiceBlendOptions;

  config: Config;

  private _services: HashMap<Service> = {};

  private _trackedServiceNames: string[] = [];

  constructor(options: Partial<ServiceBlendOptions> = {}) {
    this.options = {
      configPath: path.resolve('./serviceblend.yaml'),
      cwd: process.cwd(),
      projectName: '',
      ...options
    };
    const configLoader = new ConfigLoader();
    this.config =
      this.options.config || configLoader.load(this.options.configPath);
    if (!this.options.projectName.length) {
      if (this.config.name) {
        this.options.projectName = this.config.name;
      } else {
        const REGEX = /[^/]+$/g;
        const matches = this.options.cwd.match(REGEX);
        this.options.projectName = [...(matches || [])]?.[0];
      }
    }
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
    services: HashMap<Partial<ServiceBlendRunOptions>>,
    options: Partial<ServiceBlendRunOptions> = {}
  ) {
    try {
      await Promise.all(
        Object.entries(services).map(
          async ([serviceName, serviceOptions]: [
            string,
            Partial<ServiceBlendRunOptions>
          ]) => {
            await this.runService(serviceName, {
              ...options,
              ...serviceOptions
            });
          }
        )
      );
    } catch (err) {
      await this.onStop(undefined, false);
      throw err;
    }
  }

  async stop(
    services: HashMap<Partial<ServiceBlendStopOptions>>,
    options: Partial<ServiceBlendStopOptions> = {}
  ) {
    try {
      await Promise.all(
        Object.entries(services).map(
          async ([serviceName, serviceOptions]: [
            string,
            Partial<ServiceBlendStopOptions>
          ]) => {
            await this.stopService(serviceName, {
              ...options,
              ...serviceOptions
            });
          }
        )
      );
    } catch (err) {
      await this.onStop(undefined, false);
      throw err;
    }
  }

  async runService(
    serviceName: string,
    options: Partial<ServiceBlendRunOptions> = {}
  ) {
    this.registerService(serviceName);
    const runOptions: ServiceBlendRunOptions = {
      mode: RunnerMode.Foreground,
      ...options
    };
    const service = this._services[serviceName];
    if (!service) {
      throw new Error(`service '${serviceName}' does not exists`);
    }
    return service.run(
      runOptions.environmentName ||
        this.options.defaultEnvironmentName ||
        service.config.default ||
        Object.keys(service.config.environments)?.[0],
      runOptions
    );
  }

  async stopService(
    serviceName: string,
    options: Partial<ServiceBlendStopOptions> = {}
  ) {
    const stopOptions: ServiceBlendStopOptions = { ...options };
    const service = this._services[serviceName];
    await service.stop(
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

  async onStop(code?: string | number, exit = true, timeout = 10000) {
    const t = setTimeout(() => {
      if (exit) process.exit();
    }, timeout);
    await Promise.all(
      this._trackedServiceNames.map(async (serviceName: string) => {
        const service = this._services[serviceName];
        if (!service) return;
        await service.onStop(code);
      })
    );
    clearTimeout(t);
    if (exit) process.exit();
  }

  registerService(serviceName: string) {
    this._trackedServiceNames = [
      ...new Set([...this._trackedServiceNames, serviceName])
    ];
  }
}

export interface ServiceBlendStopOptions {
  environmentName?: string;
}

export interface ServiceBlendRunOptions {
  environmentName?: string;
  mode: RunnerMode;
  open?: boolean;
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
