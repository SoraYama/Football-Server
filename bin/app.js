"use strict";
/// <reference path="./config.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var https = require("https");
var mongoDb = require("mongodb");
var log4js = require("log4js");
var config_1 = require("./config");
var mongolib_1 = require("./mongolib");
log4js.configure(config_1.config.log4js_conf);
var logger = log4js.getLogger('app.js');
var server;
(function (server) {
    var MongoClient = mongoDb.MongoClient;
    var DB_CONN_STR = "mongodb://" + config_1.config.mongoUser + ":" + config_1.config.mongoPass + "@" + config_1.config.mongoHost + ":" + config_1.config.mongoPort + "/" + config_1.config.mongoDb;
    var app = express();
    app.use('/creategame', function (req, res, next) {
        // console.log(req)
        var formData = req.body.formData;
        var document = JSON.parse(formData);
        document['openid'] = req.body.openid;
        // console.log('document: ', document)
        MongoClient.connect(DB_CONN_STR, function (err, db) {
            if (err) {
                logger.error(err);
            }
            logger.debug("mongo insert");
            mongolib_1.mongoUtil.insertData(db, 'games', document, function (result) {
                logger.debug(result);
                db.close();
                next();
            });
        });
    });
    app.use('/openid', function (req, res, next) {
        logger.debug('req_body: ', req.body);
        var code = req.body.code;
        if (code) {
            var url = "https://api.weixin.qq.com/sns/jscode2session?appId=" + config_1.config.appId + "&secret=" + config_1.config.appSecret + "&js_code=" + code + "&grant_type=authorization_code";
            var data_1 = '';
            var hreq = https.get(url, function (hres) {
                hres.on('data', function (chunk) {
                    data_1 += chunk;
                });
                hres.on('end', function () {
                    logger.debug('parsedData: ', data_1);
                    res.write(data_1);
                    res.end();
                });
            });
        }
    });
    app.use('/all', function (req, res, next) {
        MongoClient.connect(DB_CONN_STR, function (err, db) {
            logger.debug('mongo show all');
            var openid = req.body.openid;
            mongolib_1.mongoUtil.showAllData(db, 'games', openid, function (result) {
                logger.debug(result);
                res.write(JSON.stringify(result));
                db.close();
                res.end();
            });
        });
    });
    app.use('/gamebyid', function (req, res, next) {
        try {
            MongoClient.connect(DB_CONN_STR, function (err, db) {
                logger.debug('mongo query by id connected, request: ', req.body);
                mongolib_1.mongoUtil.queryGameById(db, 'games', req.body.colId, function (result) {
                    logger.debug(result);
                    result = result[0];
                    res.write(JSON.stringify(result));
                    db.close;
                    res.end();
                });
            });
        }
        catch (e) {
            logger.error(e);
        }
    });
    app.use('/enrol', function (req, res, next) {
        res.write('Enrol succeess!');
        res.end();
    });
    app.use(function (req, res, next) {
        res.write('Response from express, ' + new Date());
        res.end();
    });
    app.listen(config_1.config.port);
    logger.info("server listening at 127.0.0.1: " + config_1.config.port);
})(server || (server = {}));
//# sourceMappingURL=app.js.map