import crypto from 'crypto'
import { Service } from 'egg'

interface IWechatLoginResponse {
  session_key: string
  openid: string
}

export default class Account extends Service {
  public async login(body: loginRequest.ILoginRequest) {
    const {
      code,
      userInfo,
      // identity: { signature, rawData },
    } = body
    // for test
    if (this.app.config.env === 'unittest' || this.app.config.env === 'ci') {
      const user = await this.setUser('test123', userInfo, true)
      return {
        id: user._id,
        isAdmin: true,
      }
    }
    // session not expired
    const userId = this.ctx.session?.id
    let auth = await this.ctx.model.Auth.findOne({ openid: this.ctx.session?.openid as string | undefined })
    if (userId) {
      return {
        id: userId,
        isAdmin: auth?.admin || false,
      }
    }
    const { session_key, openid } = await this.getWechatLoginData(code)
    // await this.validateSignature(signature, rawData, session_key)
    const user = await this.setUser(openid, userInfo)
    const { _id } = user
    this.setSession(session_key, _id, openid)
    auth = await this.ctx.model.Auth.findOne({ openid })
    return {
      id: user._id,
      isAdmin: auth?.admin || false,
    }
  }

  public async getLoginStatus(code: string) {
    const {
      model,
      helper: { CustomError, errCode },
    } = this.ctx
    const { session_key, openid } = await this.getWechatLoginData(code)
    const auth = await model.Auth.findOne({ openid })
    const isAdmin = auth?.admin || false
    this.ctx.logger.debug('auth in login', auth)
    const user = await model.Referee.findOneAndUpdate({ openid }, { isAdmin })
    if (!user) {
      throw new CustomError(errCode.NO_USER_NEED_SIGN_UP)
    }
    this.setSession(session_key, user._id, openid)
    return {
      id: user._id,
      userInfo: user.refereeWeixinInfo,
      isAdmin,
    }
  }

  public async validateSignature(signature: string, rawData: string, sessionKey?: string | null) {
    sessionKey = sessionKey || this.ctx.session?.sessionKey
    if (!sessionKey) {
      throw new this.ctx.helper.CustomError(this.ctx.helper.errCode.WX_SIGNATURE_INVALID)
    }
    const hashed = crypto
      .createHash('sha1')
      .update(`${rawData}${sessionKey}`)
      .digest('hex')
    if (hashed !== signature) {
      this.ctx.logger.warn('bad signature: hashed: %s, signature: %s', hashed, signature)
      throw new this.ctx.helper.CustomError(this.ctx.helper.errCode.NOT_SIGNIN)
    }
  }

  public setSession(sessionKey?: string | null, id?: string | null, openid?: string | null) {
    this.ctx.session = {
      sessionKey,
      id,
      openid,
    }
  }

  public async setAdmin(openid: string, admin: boolean) {
    const { Auth, Referee } = this.ctx.model
    const { CustomError, errCode } = this.ctx.helper
    const operatorAuth = await Auth.findOne({ openid: this.ctx.session?.openid || '' })
    if (!operatorAuth?.superAdmin) {
      throw new CustomError(errCode.NO_PERMISSION)
    }
    const targetUser = await Referee.findOne({ openid })
    const result = await Auth.updateOne(
      { openid },
      { admin, user: targetUser?._id || '' },
      { upsert: true }
    )
    return result
  }

  private async getWechatLoginData(code: string): Promise<IWechatLoginResponse> {
    const { APP_ID, APP_SECRET } = process.env
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appId=${APP_ID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`
    const resp = await this.ctx.curl(wxUrl, { contentType: 'application/json' })
    const data = JSON.parse((resp.data as Buffer).toString())
    if (data.errcode) {
      throw new this.ctx.helper.CustomError(this.ctx.helper.errCode.WX_CODE_ERROR)
    }
    const { session_key, openid } = data
    return {
      session_key,
      openid,
    }
  }

  private async setUser(
    openid: string,
    userInfo: loginRequest.IWeixinUserInfo = {},
    isAdmin?: boolean
  ) {
    const { Referee, Auth } = this.ctx.model
    let user = await Referee.findOne({ openid })
    const auth = await Auth.findOne({ openid })
    this.ctx.logger.debug('auth, ', auth)
    isAdmin = typeof isAdmin === 'boolean' ? isAdmin : auth?.admin || false
    if (!user) {
      user = await Referee.create({
        openid,
        refereeWeixinInfo: userInfo,
        isAdmin,
      })
    } else {
      user = await Referee.findOneAndUpdate(
        { openid },
        {
          refereeWeixinInfo: userInfo,
          isAdmin,
        }
      )
    }
    return user!
  }
}
