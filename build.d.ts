declare module MarkScript {
  interface KoaBuildConfig {
    fileServerPath?: string
  }
}

declare module 'markscript-koa' {
  class Runtime {
    constructor(buildModel: MarkScript.BuildModel, buildConfig: MarkScript.BuildConfig)

    callGet<T>(name: string, args?: { [name: string]: string | number | boolean }): Promise<T>
    callPost<T>(name: string, args?: { [name: string]: string | number | boolean }, body?: string | Object): Promise<T>
    callPut<T>(name: string, args?: { [name: string]: string | number | boolean }, body?: string | Object): Promise<T>
    callDelete<T>(name: string, args?: { [name: string]: string | number | boolean }): Promise<T>

    getService<T>(name: string): T
  }
}
