import {createDataProvider, CreateDataProviderOptions} from "@refinedev/rest"
import {CreateResponse, ListResponse} from "@/types"
import BACKEND_BASE_URL from "@/constants";
import { GetOneResponse, HttpError } from "@refinedev/core";
import { translateError } from "@/i18n";

if(!BACKEND_BASE_URL) 
  throw new Error('BACKEND_BASE_URL is not defined in the environment variables')

const buildHttpError = async (response: Response): Promise<HttpError> => {
  let message = 'Request failed'

  try {
    const payload = (await response.json()) as {
      message?: string,
      error?: { code?: string, message?: string, params?: Record<string, unknown> },
      requestId?: string,
    }
    if(payload.error?.message || payload.message) message = translateError(payload.error?.code, payload.error?.message ?? payload.message)
    return {
      message,
      statusCode: response.status,
      code: payload.error?.code,
      params: payload.error?.params,
      requestId: payload.requestId,
    }
  } catch {
    //Ignore errors
  }

  return {
    message,
    statusCode: response.status,
  }

}

const options: CreateDataProviderOptions ={
  getList:{
    getEndpoint: ({ resource }) => resource,
    
    buildQueryParams: async ({ resource, pagination, filters, sorters }) => {
      const page = pagination?.currentPage ?? 1
      const pageSize = pagination?.pageSize ?? 10

      const params: Record<string, string|number> = {page, pageSize}
      const sorter = sorters?.[0]
      if(sorter) {
        params.sort = sorter.field
        params.order = sorter.order
      }
      filters?.forEach((filter) => {
        const field = 'field' in filter ? filter.field : ''

        const value= String(filter.value)
        if(resource === 'subjects'){
          if(field === 'department') params.department = value
          if(field ==='name' || field === 'code') params.search = value
        } else if (resource === 'users') {
          if (field === 'role') params.role = value
          if (field === 'search') params.search = value
        } else if (resource === 'departments' || resource === 'semesters') {
          if (field === 'search') params.search = value
        } else if (resource === 'classes') {
          if (field === 'name') params.search = value
          if (field === 'subject') params.subject = value
          if (field === 'teacher') params.teacher = value
        }
      })
      return params
    },
        
    mapResponse: async ( response ) => {
      if(!response.ok) throw await buildHttpError(response)
      const payload: ListResponse = await response.clone().json()

      return payload.data ?? []
    },
    getTotalCount: async (response) => {
      if(!response.ok) throw await buildHttpError(response)
      const payload: ListResponse = await response.clone().json()

      return payload.pagination?.total  ?? payload.data?.length ?? 0
    }

  },

  create: {
    getEndpoint: ({ resource }) => resource,

    buildBodyParams: async ({ variables }) => variables,

    mapResponse: async (response) => {
      if(!response.ok) throw await buildHttpError(response)
      const json: CreateResponse = await response.json()
      return json.data ?? {}
    }
  },

  getOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,

    mapResponse: async (response) => {
      if(!response.ok) throw await buildHttpError(response)
      const json: GetOneResponse = await response.json()

      return json.data ?? {}
    }
  }
  ,
  update: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    buildBodyParams: async ({ variables }) => variables,
    mapResponse: async (response) => {
      if (!response.ok) throw await buildHttpError(response)
      const json: CreateResponse = await response.json()
      return json.data ?? {}
    },
  },
  deleteOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    mapResponse: async (response) => {
      if (!response.ok) throw await buildHttpError(response)
      return { id: response.headers.get('x-resource-id') ?? undefined }
    },
  },

}

const { dataProvider } = createDataProvider(BACKEND_BASE_URL, options, { credentials: 'include' })
export { dataProvider }
