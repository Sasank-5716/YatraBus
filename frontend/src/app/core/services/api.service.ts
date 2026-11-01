import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

/** Error raised by ApiService: message from the server's `{ error }` body, plus status and parsed payload. */
export class ApiError extends Error {
  constructor(message: string, public status: number, public data: any) { super(message); }
}

type Query = Record<string, string | number | boolean | null | undefined>;

/** Thin promise-based wrapper over HttpClient (headers/credentials are added by apiInterceptor). */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  get<T>(url: string, query?: Query) { return this.request<T>('GET', url + this.qs(query)); }
  post<T>(url: string, body: unknown = {}) { return this.request<T>('POST', url, body); }
  put<T>(url: string, body: unknown) { return this.request<T>('PUT', url, body); }
  delete<T>(url: string) { return this.request<T>('DELETE', url); }

  async request<T>(method: string, url: string, body?: unknown): Promise<T> {
    try {
      const res = await lastValueFrom(this.http.request(method, url, { body, observe: 'response', responseType: 'text' }));
      try { return (res.body ? JSON.parse(res.body) : null) as T; } catch { return null as T; }
    } catch (e) {
      if (!(e instanceof HttpErrorResponse)) throw e;
      let data: any = null; try { data = typeof e.error === 'string' ? JSON.parse(e.error) : null; } catch { /* non-JSON body */ }
      throw new ApiError(e.status === 0 ? 'Failed to fetch' : data?.error || `Request failed (${e.status})`, e.status, data);
    }
  }
  qs(q?: Query) {
    if (!q) return '';
    const p = new URLSearchParams(); for (const [k, v] of Object.entries(q)) p.set(k, v == null ? '' : String(v));
    return '?' + p.toString();
  }
}
