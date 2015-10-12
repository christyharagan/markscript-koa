import * as path from 'path'
import * as io from 'socket.io'
import * as http from 'http'
import * as m from 'markscript-core'
import * as mu from 'markscript-uservices'
import * as u from 'uservices'
import {RxRouter} from 'koa-rx-router'
import {createLocalProxy} from 'uservices-socket.io-server'
import {DatabaseClient, createDatabaseClient} from 'marklogic'
import * as fs from 'fs'

let koa = require('koa')
let serve = require('koa-static')
let mount = require('koa-mount')
let cors = require('koa-cors')

export interface RunOptions {
  database: {
    databaseName: string
    host: string
    port: number
    user: string
    password: string
  }
  middle: {
    host: string
    port: number
  }
  pkgDir?: string
  serviceSpecs?: mu.MLServices
  fileServerPath?: string
}


export class Server {
  private options: RunOptions
  private services: { [name: string]: any } = {}
  private httpServer: http.Server
  private client: DatabaseClient

  getService<T>(name: string): T {
    return this.services[name]
  }

  callGet<T>(name: string, args?: { [name: string]: string | number | boolean }): Promise<T> {
    let self = this
    return new Promise(function(resolve, reject) {
      self.client.resources.get(name, args).result(resolve, reject)
    })
  }

  callPost<T>(name: string, args?: { [name: string]: string | number | boolean }, body?: string | Object | Buffer | NodeJS.ReadableStream): Promise<T> {
    let self = this
    return new Promise(function(resolve, reject) {
      self.client.resources.post(name, args, body).result(resolve, reject)
    })
  }

  callPut<T>(name: string, args?: { [name: string]: string | number | boolean }, body?: string | Object | Buffer | NodeJS.ReadableStream): Promise<T> {
    let self = this
    return new Promise(function(resolve, reject) {
      self.client.resources.put(name, args, body).result(resolve, reject)
    })
  }

  callDelete<T>(name: string, args?: { [name: string]: string | number | boolean }): Promise<T> {
    let self = this
    return new Promise(function(resolve, reject) {
      self.client.resources.remove(name, args).result(resolve, reject)
    })
  }

  constructor(options: RunOptions) {
    this.options = options
    if (!options.serviceSpecs) {
      if (!options.pkgDir) {
        throw new Error('To run markscript-koa, you must provide either service-specs, or a package directory with a service-specs.json')
      }
      if (fs.existsSync(path.join(options.pkgDir, 'deployed', 'service-specs.json'))) {
        options.serviceSpecs = u.parse(fs.readFileSync(path.join(options.pkgDir, 'deployed', 'service-specs.json')).toString())
      } else if (fs.existsSync(path.join(options.pkgDir, 'service-specs.json'))) {
        options.serviceSpecs = u.parse(fs.readFileSync(path.join(options.pkgDir, 'service-specs.json')).toString())
      } else {
        throw new Error('To run markscript-koa, you must provide either service-specs, or a package directory with a service-specs.json')
      }
    }
  }

  stop() {
    this.httpServer.close()
  }

  start(): Promise<Server> {
    let self = this
    return new Promise(function(resolve, reject) {
      let app = koa()
      app.use(cors())
      let router = new RxRouter()

      app.use(router.routes())
      if (self.options.fileServerPath) {
        app.use(serve(self.options.fileServerPath))
      }

      let fn = app.callback()

      let httpServer = http.createServer(fn)
      let ioServer = io(httpServer)

      self.client = createDatabaseClient({
        port: self.options.database.port,
        host: self.options.database.host,
        password: self.options.database.password,
        user: self.options.database.user,
        database: self.options.database.databaseName
      })

      u.visitServices(self.options.serviceSpecs, {
        onService: function(service) {
          let proxy = mu.createRemoteProxy(service, self.client, router)
          self.services[service.name] = proxy
          createLocalProxy(ioServer, service, proxy)
        }
      })

      self.httpServer = httpServer
      httpServer.listen(self.options.middle.port, self.options.middle.host, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve(self)
        }
      })
    })
  }
}
