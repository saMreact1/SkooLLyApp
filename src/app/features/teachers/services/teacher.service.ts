import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  CreateTeacherRequest,
  UpdateTeacherRequest,
  TeacherResponse,
  TeacherStatus,
} from '../models/teacher.models';

@Injectable({ providedIn: 'root' })
export class TeacherService {
  private readonly http = inject(HttpClient);
  private readonly api  = `${environment.apiUrl}/teachers`;

  getAll(): Observable<TeacherResponse[]> {
    return this.http
      .get<ApiResponse<TeacherResponse[]>>(this.api)
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<TeacherResponse> {
    return this.http
      .get<ApiResponse<TeacherResponse>>(`${this.api}/${id}`)
      .pipe(map(r => r.data));
  }

  create(payload: CreateTeacherRequest): Observable<TeacherResponse> {
    return this.http
      .post<ApiResponse<TeacherResponse>>(this.api, payload)
      .pipe(map(r => r.data));
  }

  update(id: number, payload: UpdateTeacherRequest): Observable<TeacherResponse> {
    return this.http
      .put<ApiResponse<TeacherResponse>>(`${this.api}/${id}`, payload)
      .pipe(map(r => r.data));
  }

  updateStatus(id: number, status: TeacherStatus): Observable<TeacherResponse> {
    const params = new HttpParams().set('status', status);
    return this.http
      .patch<ApiResponse<TeacherResponse>>(
        `${this.api}/${id}/status`, {}, { params }
      )
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.api}/${id}`)
      .pipe(map(() => void 0));
  }

  getCount(): Observable<number> {
    return this.http
      .get<ApiResponse<number>>(`${this.api}/count`)
      .pipe(map(r => r.data));
  }
}
