let cfEnv: any = null;

export function setCfEnv(env: any) {
  cfEnv = env;
}

export function getEnv(key: string): any {
  if (cfEnv && cfEnv[key] !== undefined) {
    return cfEnv[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
}
