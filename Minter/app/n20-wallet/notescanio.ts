import type { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'

import type { IContract } from './n20_types'

export class NoteOrg {
  private _httpClient
  constructor(host: string) {
    this._httpClient = axios.create({
      baseURL: host,
    })
  }

  _parseResponse(response: AxiosResponse) {
    return response.data
  }

  _parseError(error: AxiosError) {
    if (error.response) {
      // server return error
      console.log(
        '🚀 ~ file: notescanio.ts:143 ~ NoteOrg ~ _parseError',
        `${error.config?.baseURL}${error.config?.url}`,
        error.response.status,
        error.response.headers,
        error.response.data
      )
      throw new Error(JSON.stringify(error.response.data))
    } else if (error.request) {
      // console.warn( error.message )
      throw new Error(error.message)
    } else {
      // console.warn( 'Error', error )
      throw error
    }
  }

  _get(command: string, params: any) {
    // Create query with given parameters, if applicable
    params = params || {}

    const options = {
      params,
    }

    return this._httpClient.get(command, options).then(this._parseResponse).catch(this._parseError)
  }

  _post(command: string, data: any) {
    const options = {
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
      },
    }

    return this._httpClient
      .post(command, data, options)
      .then(this._parseResponse)
      .catch(this._parseError)
  }

  async getContracts(network: string): Promise<IContract[]> {
    const result: IContract[] = await this._get('/api/contracts/' + network, {})

    return result
  }
}
