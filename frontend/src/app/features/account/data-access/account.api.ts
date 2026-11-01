import { Injectable, inject } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import type { User } from '../../../core/models/api.models';

@Injectable({ providedIn: 'root' })
export class AccountApi {
  private api = inject(ApiService);
  update(d: { name: string; email: string; phone: string }) { return this.api.put<{ user: User }>('/api/account', d); }
  changePassword(d: { current: string; password: string; confirm: string }) { return this.api.post('/api/account/password', d); }
}
