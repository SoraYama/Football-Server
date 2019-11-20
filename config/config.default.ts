import { EggAppConfig, EggAppInfo, PowerPartial, Context } from 'egg'

export interface BizConfig {
  sourceUrl: string
}

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1573541543157_1398'

  config.session = {
    key: 'FOOTBALL_SESS',
    renew: true,
  }

  config.mongoose = {
    client: {
      url: 'mongodb://sorayama:sorayama@127.0.0.1:27017/football',
      options: {
        useNewUrlParser: true,
      },
    },
  }

  // add your egg config in here
  config.middleware = ['requestLogging', 'throwBizError']

  config.onerror = {
    all(err: any, ctx: Context) {
      if (err.message === 'Validation Failed') {
        ctx.status = ctx.HTTP_STATUS_CODES.BAD_REQUEST
        const resp = {
          data: err.errors,
          errMsg: '请求参数错误',
          status: ctx.helper.errCode.INVALID_PARAM,
        }
        ctx.body = ctx.headers.accept === 'application/json' ? resp : JSON.stringify(resp)
        return
      }
      ctx.status = ctx.HTTP_STATUS_CODES.OK
      ctx.body = {
        errMsg: err.message,
        status: 1,
      }
    },
  }

  config.cors = {
    credentials: true,
    keepHeadersOnError: true,
    origin: (ctx: Context) => ctx.request.get('origin'),
  }

  config.security = {
    csrf: false,
  }

  config.session = {
    key: 'EGG_SESS',
    renew: true,
  }

  // add your special config in here
  const bizConfig: BizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
  }

  // the return config will combines to EggAppConfig
  return {
    ...config,
    ...bizConfig,
  }
}
