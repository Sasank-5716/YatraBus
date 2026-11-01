import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { User } from '../../../core/models/api.models';

export interface SignupRequest { name: string; email: string; phone: string; password: string; confirm: string; }

@Injectable({ providedIn: 'root' })
export class AuthApi {
  private api = inject(ApiService);
  login(email: string, password: string) { return this.api.post<{ user: User }>('/api/auth/login', { email, password }); }
  signup(d: SignupRequest) { return this.api.post<{ user: User }>('/api/auth/signup', d); }
}
