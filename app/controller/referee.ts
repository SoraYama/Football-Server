import { Controller } from 'egg'

export default class Referee extends Controller {
  public async getReferee() {
    const { refereeId } = this.ctx.query
    const result = await this.ctx.service.referee.queryReferee(refereeId as string)
    this.ctx.body = this.ctx.helper.responseFormat(result)
    return
  }

  public async updateReferee() {
    const rules = {
      refereeName: 'string',
      refereeHeight: 'string',
      refereeWeight: 'string',
      refereePhoneNumber: 'string',
      refereeIdNumber: 'string',
      refereeScholarId: 'string',
      refereeCardNumber: 'string',
      refereeBankNumber: 'string',
      refereeClass: 'string',
    }
    this.ctx.validate(rules, this.ctx.request.body)
    const result = await this.ctx.service.referee.updateRefereeInfo(this.ctx.request.body)
    this.ctx.body = this.ctx.helper.responseFormat(result)
  }
}
