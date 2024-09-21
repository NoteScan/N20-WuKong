import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'

export class Indexnote {
  private _httpClient
  constructor(host: string, apiKey = '1234567890') {
    this._httpClient = axios.create({
      baseURL: host,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  }

  _parseResponse(response: AxiosResponse) {
    return response.data
  }

  _parseError(error: AxiosError) {
    if (error.response) {
      // server return error
      throw new Error(JSON.stringify(error.response.data))
    } else if (error.request) {
      // console.warn( error.message )
      throw new Error(error.message)
    } else {
      // console.warn( 'Error', error )
      throw error
    }
  }

  _get(command, params) {
    // Create query with given parameters, if applicable
    params = params || {}

    const options = {
      params,
    }

    return this._httpClient.get(command, options).then(this._parseResponse).catch(this._parseError)
  }

  _post(command, data) {
    const options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

    return this._httpClient
      .post(command, data, options)
      .then(this._parseResponse)
      .catch(this._parseError)
  }

  async tickStat(tick: string) {
    return await this._post('noteTicks?batch=1', { '0': { tick: tick } })
  }
}
