declare module 'node:child_process' {
  export function execFileSync(command: string, args?: ReadonlyArray<string>, options?: any): string
}

declare module 'node:path' {
  export function resolve(...paths: string[]): string
  export function join(...paths: string[]): string
}

declare const process: {
  env: Record<string, string | undefined>
  cwd: () => string
}
