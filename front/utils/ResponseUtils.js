import _ from 'lodash'
const STATUS_CODE_SUCCESS = 200
const STATUS_CODE_SUCCESS_DELETE = 204

export default class ResponseUtils {
  static isSuccess(response) {
    const responseStatus = _.get(response, 'status', ' - ')
    const successCodesList = [STATUS_CODE_SUCCESS, STATUS_CODE_SUCCESS_DELETE]
    return successCodesList.includes(responseStatus)
  }
}
