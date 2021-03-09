import YAML from 'yaml';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { ExecaChildProcess, ExecaError } from 'execa';
import Plugin, { PluginDeclaration } from '~/plugin';
import DockerCompose from './dockerCompose';

export default class DockerComposePlugin extends Plugin<DockerComposePluginDeclaration> {
  static pluginName = 'docker-compose';

  private _contexts: Context[] = [];

  async onRun() {
    if (typeof this.declaration.compose === 'string') {
      const dockerCompose = new DockerCompose({
        file: path.resolve(process.cwd(), this.declaration.compose)
      });
      if (this.declaration.service?.length) {
        try {
          const result = await dockerCompose.run(
            { serviceName: this.declaration.service },
            {},
            (p: ExecaChildProcess) => {
              this._contexts.push({ tmpPath, dockerCompose, p });
            }
          );
          return result;
        } catch (err) {
          const error: ExecaError = err;
          if (error.exitCode === 1) return null;
          throw err;
        }
      }
      return dockerCompose.up({}, {}, (p: ExecaChildProcess) => {
        this._contexts.push({ dockerCompose, p });
      });
    }
    const tmpPath = await fs.mkdtemp(`${os.tmpdir()}/`);
    await fs.mkdirs(tmpPath);
    await fs.writeFile(
      path.resolve(tmpPath, 'docker-compose.yaml'),
      YAML.stringify(this.declaration)
    );
    const dockerCompose = new DockerCompose({ cwd: tmpPath });
    return dockerCompose.up({}, {}, (p: ExecaChildProcess) => {
      this._contexts.push({ tmpPath, dockerCompose, p });
    });
  }

  async onStop() {
    await Promise.all(
      this._contexts.map(async ({ tmpPath }: Context) => {
        if (tmpPath) fs.removeSync(tmpPath);
      })
    );
  }
}

export interface DockerComposePluginDeclaration extends PluginDeclaration {
  compose?: string;
  service?: string;
  version?: string;
  [key: string]: any;
}

export interface Context {
  dockerCompose: DockerCompose;
  p: ExecaChildProcess;
  tmpPath?: string;
}
