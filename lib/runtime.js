var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var io = require('socket.io');
var http = require('http');
var mu = require('markscript-uservices-build');
var b = require('markscript-basic-build');
var u = require('uservices');
var koa_rx_router_1 = require('koa-rx-router');
var uservices_socket_io_server_1 = require('uservices-socket.io-server');
var koa = require('koa');
var serve = require('koa-static');
var cors = require('koa-cors');
var Runtime = (function (_super) {
    __extends(Runtime, _super);
    function Runtime(buildModel, buildConfig) {
        _super.call(this, buildModel, buildConfig);
        this.services = {};
        this.buildModel = buildModel;
        this.buildConfig = buildConfig;
    }
    Runtime.prototype.getService = function (name) {
        return this.services[name];
    };
    Runtime.prototype.stop = function () {
        this.httpServer.close();
    };
    Runtime.prototype.start = function () {
        var self = this;
        return new Promise(function (resolve, reject) {
            var app = koa();
            app.use(cors());
            var router = new koa_rx_router_1.RxRouter();
            app.use(router.routes());
            if (self.buildConfig.fileServerPath) {
                app.use(serve(self.buildConfig.fileServerPath));
            }
            var fn = app.callback();
            var httpServer = http.createServer(fn);
            var ioServer = io(httpServer);
            var client = self.getClient();
            if (self.buildModel.serviceSpecs) {
                u.visitServices(self.buildModel.serviceSpecs, {
                    onService: function (service) {
                        var proxy = mu.createRemoteProxy(service, client, router);
                        self.services[service.name] = proxy;
                        uservices_socket_io_server_1.createLocalProxy(ioServer, service, proxy);
                    }
                });
            }
            self.httpServer = httpServer;
            httpServer.listen(self.buildConfig.middle.port, self.buildConfig.middle.host, function (err) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(self);
                }
            });
        });
    };
    return Runtime;
})(b.Runtime);
exports.Runtime = Runtime;
//# sourceMappingURL=runtime.js.map