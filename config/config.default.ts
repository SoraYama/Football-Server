import { EggAppConfig, EggAppInfo, PowerPartial, Context } from 'egg'

export interface BizConfig {
  sourceUrl: string
}

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>

  config.mongoose = {
    client: {
      url: '', // set in app.ts
      options: {
        useNewUrlParser: true,
        useFindAndModify: false,
      },
    },
  }

  // add your egg config in here
  config.middleware = ['requestLogging']

  config.onerror = {
    all(err: any, ctx: Context) {
      const { CustomError, HttpError } = ctx.helper
      let status = 500
      let data = null
      let errMsg = err.message
      if (err.message === 'Validation Failed') {
        ctx.status = ctx.HTTP_STATUS_CODES.BAD_REQUEST
        data = err.errors
        errMsg = '请求参数错误'
        status = ctx.helper.errCode.INVALID_PARAM
      } else if (err instanceof CustomError || err instanceof HttpError) {
        const info = err.getInfo()
        ctx.status = err instanceof HttpError ? info.status : 200
        status = info.status
        errMsg = info.message
      }
      const resp = {
        data,
        errMsg,
        status,
      }
      if (ctx.headers.accept) {
        ctx.body = (ctx.headers.accept as string).indexOf('application/json') > -1 ? resp : JSON.stringify(resp)
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

  config.redis = {
    agent: true,
    // other set in app.ts
  }

  config.session = {
    key: 'collina_session',
    renew: true,
  }

  config.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
      '.tpl': 'nunjucks',
    },
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
