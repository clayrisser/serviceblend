import execa, { ExecaChildProcess, ExecaReturnValue } from 'execa';
import open from 'open';
import { mapSeries } from 'bluebird';
import {
  Command,
  Connections,
  Config,
  Options,
  Processes,
  TerminalMap,
  Terminal
} from '../types';

export const processes: Processes = {};

export const terminalMap: TerminalMap = {
  xterm: ['xterm', ['-e']]
};

export async function runCommand(
  command: Command,
  options: Options,
  terminalName: string | boolean = 'xterm'
): Promise<ExecaReturnValue | ExecaChildProcess[] | null> {
  if (typeof command === 'string') {
    return new Promise<ExecaChildProcess>((resolve, reject) => {
      try {
        const ps = execa.command(command, {
          cwd: options.rootPath,
          env: process.env,
          stdout: 'inherit'
        });
        processes[ps.pid] = ps;
        return ps.on('exit', () => resolve(ps));
      } catch (err) {
        return reject(err);
      }
    });
  }
  const commands = command;
  if (!commands.length) return null;
  return new Promise<ExecaChildProcess[] | null>(async (resolve, reject) => {
    const pids = new Set<number>();
    const scopedProcesses: ExecaChildProcess[] = [];
    const terminal =
      typeof terminalName === 'boolean'
        ? terminalName
          ? 'xterm'
          : null
        : !terminalMap[terminalName]
        ? ([terminalName, ['-e']] as Terminal)
        : terminalMap[terminalName];
    function deletePid(pid: number) {
      pids.delete(pid);
      if (!pids.size) resolve(scopedProcesses);
    }
    function handlePs(ps: ExecaChildProcess) {
      pids.add(ps.pid);
      processes[ps.pid] = ps;
      scopedProcesses[ps.pid] = ps;
      return ps.on('exit', () => deletePid(ps.pid));
    }
    try {
      const command = commands.shift()!;
      const ps = execa.command(command, {
        cwd: options.rootPath,
        env: process.env,
        stdout: 'inherit'
      });
      handlePs(ps);
      return mapSeries(commands, async (command: string) => {
        let ps: ExecaChildProcess;
        if (terminal) {
          ps = execa(terminal[0], [...terminal[1], command], {
            cwd: options.rootPath,
            env: process.env,
            stdout: 'inherit'
          });
        } else {
          ps = execa.command(command, {
            cwd: options.rootPath,
            env: process.env,
            stdout: 'inherit'
          });
        }
        return handlePs(ps);
      });
    } catch (err) {
      return reject(err);
    }
  });
}

export default async function start(
  connections: Connections,
  config: Config,
  options: Options
) {
  await mapSeries(
    Object.entries(connections),
    async ([serviceName, environmentName]: [string, string]) => {
      const service = config.services[serviceName];
      if (!service) return;
      const environment = service?.environments[environmentName];
      if (!environment) return;
      if (environment.start?.command) {
        runCommand(environment.start.command, options);
      }
      if (environment.start?.open) await open(environment.start.open);
    }
  );
}
