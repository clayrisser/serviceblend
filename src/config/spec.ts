import { validate, Config } from './index';

describe('validate()', () => {
  it('should accept valid config', () => {
    expect(
      validate(
        { services: { serviceA: { default: 'local', environments: {} } } },
        Config
      )
    ).toBeUndefined();
  });

  it('should error for invalid config', () => {
    try {
      validate({ services: [] }, Config);
    } catch (err) {
      expect(err).toStrictEqual(
        new Error(
          'Invalid value [] supplied to : { services: { [K in string]: { default: (undefined | string), environments: { [K in string]: { plugin: string } } } } }/services: { [K in string]: { default: (undefined | string), environments: { [K in string]: { plugin: string } } } }'
        )
      );
    }
  });
});
