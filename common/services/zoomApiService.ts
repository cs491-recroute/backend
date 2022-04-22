import Axios, { AxiosInstance } from 'axios';

// eslint-disable-next-line no-unused-vars
type ZoomApiService = AxiosInstance & {
    addToken: (token: string) => AxiosInstance
}
export const zoomApiService = Axios.create() as ZoomApiService;

let interceptor: number;
zoomApiService.addToken = (token: string): AxiosInstance => {
    if (interceptor) zoomApiService.interceptors.request.eject(interceptor);
    interceptor = zoomApiService.interceptors.request.use(req => {
        const url = `https://api.zoom.us/v2`;
        req.url = url + req.url;
        req.headers = {
            Authorization: `Bearer ${token}`
        }
        return req;
    });
    return zoomApiService;
};