import { IHttpService } from '../interfaces/IHttpService';

export class HttpService implements IHttpService {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${url}`);
    }
    return response.json();
  }

  async head(url: string): Promise<{ ok: boolean; status: number }> {
    const response = await fetch(url, { method: 'HEAD', cache: 'no-cache' });
    return { ok: response.ok, status: response.status };
  }
}
