import pkgDir from 'pkg-dir';
import { Options } from './types';

const defaultOptions: Options = {
  debug: false,
  hold: false,
  rootPath: pkgDir.sync(process.cwd()) || process.cwd()
};

export default defaultOptions;
