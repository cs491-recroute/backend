import Axios, { AxiosInstance } from 'axios';
import { SERVICES } from '../constants/services';

// eslint-disable-next-line no-unused-vars
type ApiService = AxiosInstance & { useService: (service: SERVICES) => AxiosInstance }
export const apiService = Axios.create() as ApiService;

let interceptor: number;
apiService.useService = (service: SERVICES): AxiosInstance => {
    if (interceptor) apiService.interceptors.request.eject(interceptor);
    interceptor = apiService.interceptors.request.use(req => {
        const endpoint = process.env[`${SERVICES[service]}_RUNNING`] ? 'localhost' : 'recroute.co';
        const prefix = `https://${endpoint}:${service}`;
        if (!req.url?.startsWith(prefix)) req.url = prefix + req.url;
        return req;
    });
    return apiService;
};