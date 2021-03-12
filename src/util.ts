export function parseArg<Options>(
  arg: string,
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
      const key = optionBlockArr.shift();
      if (!key) return options;
      const value = optionBlockArr.length ? optionBlockArr.join('=') : true;
      options[key] = value;
      return options;
    }, {})
  };
  return {
    serviceName,
    environmentName,
    options
  };
}

export interface ParseArgResponse<Options> {
  environmentName?: string;
  options: Partial<Options>;
  serviceName: string;
}
