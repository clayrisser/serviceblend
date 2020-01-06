import pkgDir from 'pkg-dir';
import { Options } from './types';

const defaultOptions: Options = {
  rootPath: pkgDir.sync(process.cwd()) || process.cwd(),
  debug: false
};

export default defaultOptions;
