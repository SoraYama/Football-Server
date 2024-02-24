import { Service } from 'egg'
import { some, isEqual, find } from 'lodash'
import { Types } from 'mongoose'

/**
 * Enrol Service
 * @export
 * @class Enrol
 * @extends {Service}
 */
export default class Enrol extends Service {
  public async enrolGame(body: gameRequest.IEnrolGame, isUpdate: boolean) {
    const { gameId, availablePeriod, refereeName } = body
    const { user } = this.ctx
    const game = await this.getGame(gameId)
    const isEnrolled = some(game.referees, ({ referee }) => isEqual(referee._id, user?._id))
    if (isEnrolled && !isUpdate) {
      throw new this.ctx.helper.CustomError(this.ctx.helper.errCode.CANNOT_RE_ENROL)
    }
    await game.updateOne(
      {
        [isUpdate ? '$set' : '$push']: {
          referees: { referee: user?._id, availablePeriod, enrolName: refereeName },
        },
      },
      { upsert: true }
    )
    return `${isUpdate ? '更新' : '报名'}成功`
  }

  public async cancelEnrol(gameId: string) {
    const _id = this.ctx.user?._id
    const game = await this.getGame(gameId)
    if (!some(game.referees, ({ referee }) => isEqual(referee._id, _id))) {
      throw new this.ctx.helper.CustomError(this.ctx.helper.errCode.CANNOT_CANCEL_NOT_ENROLED_GAME)
    }
    await (this.ctx.model.Game.findOneAndUpdate as any)(
      { _id: gameId },
      { $pull: { referees: { referee: _id } } }
    )
    return '取消成功'
  }

  public async updateAssignStatus(gameId: string, refereeId: string, assigned = true) {
    const game = await this.getGame(gameId)
    const { referees } = game
    const referee = find(referees, item => isEqual(item.referee._id.toString(), refereeId))
    if (!referee) {
      throw new this.ctx.helper.CustomError(this.ctx.helper.errCode.BAD_REFEREE_ID)
    }
    await this.ctx.model.Game.updateOne(
      { _id: Types.ObjectId(gameId), 'referees.referee': Types.ObjectId(refereeId) },
      { $set: { 'referees.$.assigned': assigned } }
    )
    return `${!assigned ? '取消' : ''}选派成功`
  }

  private async getGame(gameId: string) {
    const game = await this.ctx.model.Game.findById(gameId)
    if (!game) {
      throw new this.ctx.helper.CustomError(this.ctx.helper.errCode.BAD_GAME_ID)
    }
    return game
  }
}
