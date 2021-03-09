import YAML from 'yaml';
import { ExecaChildProcess } from 'execa';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import Plugin, { PluginDeclaration } from '~/plugin';
import DockerCompose from './dockerCompose';

export default class DockerComposePlugin extends Plugin<DockerComposePluginDeclaration> {
  static pluginName = 'docker-compose';

  private _contexts: Context[] = [];

  async run() {
    if (typeof this.declaration.compose === 'string') {
      const dockerCompose = new DockerCompose({
        file: path.resolve(process.cwd(), this.declaration.compose)
      });
      if (this.declaration.services?.length) {
        // return dockerCompose.run();
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
  services?: any[];
  version?: string;
  [key: string]: any;
}

export interface Context {
  dockerCompose: DockerCompose;
  p: ExecaChildProcess;
  tmpPath?: string;
}
