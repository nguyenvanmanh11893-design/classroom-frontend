import { BaseRecord, DataProvider, GetListParams, GetListResponse } from "@refinedev/core";
import { subjects } from "../constants/mock-data";

export const dataProvider: DataProvider = {
  getList: async <TData extends BaseRecord = BaseRecord>({ resource }: GetListParams): Promise<GetListResponse<TData>> => {
    if (resource === 'subjects') {
      return {
        data: subjects as unknown as TData[],
        total: subjects.length,
      };
    }

    return { data: [] as TData[], total: 0 };
  },

  getOne: async () => {throw new Error('This function is not present in mock')},
  create: async () => {throw new Error('This function is not present in mock')},
  update: async () => {throw new Error('This function is not present in mock')},
  deleteOne: async () => {throw new Error('This function is not present in mock')},
  
  getApiUrl: () => '',

}