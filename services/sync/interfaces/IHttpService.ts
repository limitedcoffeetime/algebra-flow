export interface IHttpService {
  get<T>(url: string): Promise<T>;
  head(url: string): Promise<{ ok: boolean; status: number }>;
}
