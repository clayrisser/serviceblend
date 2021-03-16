import * as t from 'io-ts';
import { PathReporter } from 'io-ts/PathReporter';
import { HashMap } from '~/types';

export function parseArg<Options>(
  arg: string,
  maps: HashMap<any> = {},
  defaultOptions: Partial<Options> = {}
): ParseArgResponse<Options> {
  const argArr = arg.split(':');
  const serviceBlock = argArr.shift()?.split('=') || [];
  const optionBlocks = argArr.join(':').split(',');
  const [serviceName, environmentName] = [serviceBlock?.[0], serviceBlock?.[1]];
  const options: Partial<Options> = {
    ...defaultOptions,
    ...optionBlocks.reduce((options: Partial<Options>, optionBlock: string) => {
      const optionBlockArr = optionBlock.split('=');
      let key = optionBlockArr.shift();
      if (!key) return options;
      const value = optionBlockArr.length ? optionBlockArr.join('=') : true;
      key = typeof maps[key] === 'string' ? maps[key] : key;
      if (typeof key === 'undefined') return options;
      if (typeof maps[key] === 'object' && !Array.isArray(maps[key])) {
        options = {
          ...options,
          ...maps[key]
        };
      } else {
        options[key] = value;
      }
      return options;
    }, {})
  };
  return {
    serviceName,
    environmentName,
    options
  };
}

export function validate<T = any>(value: T, Type: t.Type<any>) {
  const errors = PathReporter.report(Type.decode(value));
  const message = errors.join('; ');
  if (message === 'No errors!') return;
  throw new Error(message);
}

export interface ParseArgResponse<Options> {
  environmentName?: string;
  options: Partial<Options>;
  serviceName: string;
}
