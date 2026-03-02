import { Config } from 'ziggy-js';

declare global {
  interface Window {
    route: (
      name: string,
      params?: Record<string, any>,
      absolute?: boolean,
      config?: Config
    ) => string;
    Ziggy: Config;
  }
}

declare const route: Window['route'];

export default route;
