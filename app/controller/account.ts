import { Controller } from 'egg'

export default class Account extends Controller {
  public async register() {
    this.ctx.validate(
      {
        code: { type: 'string', required: true },
        identity: {
          type: 'object',
          rule: {
            signature: 'string',
            rawData: 'string',
          },
        },
        userInfo: {
          type: 'object',
          rule: {
            avatarUrl: 'string',
            city: 'string',
            country: 'string',
            gender: 'number',
            language: 'string',
            nickName: 'string',
            province: 'string',
          },
        },
      },
      this.ctx.request.body
    )

    const result = await this.ctx.service.account.login(this.ctx.request.body)
    this.ctx.body = this.ctx.helper.responseFormat(result)
  }

  public async login() {
    const { query, service, helper } = this.ctx
    this.ctx.validate(
      {
        code: 'string',
      },
      query
    )
    const result = await service.account.getLoginStatus(query.code as string)
    this.ctx.body = helper.responseFormat(result)
  }

  public async setAdmin() {
    const rule = {
      openid: 'string',
      admin: {
        type: 'boolean',
        required: false,
        default: true,
      },
    }
    this.ctx.validate(rule, this.ctx.request.body)
    const { openid, admin = true } = this.ctx.request.body
    const result = await this.ctx.service.account.setAdmin(openid, admin)
    this.ctx.body = this.ctx.helper.responseFormat(result)
  }
}
