import execa, { ExecaChildProcess, ExecaReturnValue } from 'execa';
import { mapSeries } from 'bluebird';
import { Command, Options, Processes, Terminal, TerminalMap } from '../types';

export type NewTerminal = 'always' | 'never' | 'first' | boolean;

export const processes: Processes = {};

export const parentPids = new Set<number>();

export const terminalMap: TerminalMap = {
  xterm: ['xterm', ['-e']]
};

export function getDefaultTerminal() {
  return 'xterm';
}

export function getTerminal(terminalName: string): Terminal {
  return terminalMap[terminalName]
    ? terminalMap[terminalName]
    : ([terminalName, ['-e']] as Terminal);
}

export async function runProcess(
  command: Command,
  options: Options,
  newTerminal: NewTerminal = 'first',
  terminalName = getDefaultTerminal()
): Promise<ExecaReturnValue | ExecaChildProcess[] | null> {
  let ps: ExecaChildProcess;
  const terminal = getTerminal(terminalName);
  if (typeof command === 'string') {
    return new Promise<ExecaChildProcess>((resolve, reject) => {
      function handlePs(ps: ExecaChildProcess) {
        processes[ps.pid] = ps;
        parentPids.delete(ps.pid);
        return ps.on('exit', () => resolve(ps));
      }
      try {
        if (newTerminal === 'always') {
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
          parentPids.add(ps.pid);
        }
        return handlePs(ps);
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
    function deletePid(pid: number) {
      pids.delete(pid);
      if (!pids.size) resolve(scopedProcesses);
    }
    function handlePs(ps: ExecaChildProcess) {
      pids.add(ps.pid);
      processes[ps.pid] = ps;
      scopedProcesses[ps.pid] = ps;
      parentPids.delete(ps.pid);
      return ps.on('exit', () => deletePid(ps.pid));
    }
    try {
      if (newTerminal === true || newTerminal === 'first') {
        const command = commands.shift()!;
        ps = execa.command(command, {
          cwd: options.rootPath,
          env: process.env,
          stdout: 'inherit'
        });
        parentPids.add(ps.pid);
        handlePs(ps);
      }
      return mapSeries(commands, async (command: string) => {
        if (newTerminal && newTerminal !== 'never') {
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
          parentPids.add(ps.pid);
        }
        return handlePs(ps);
      });
    } catch (err) {
      return reject(err);
    }
  });
}
