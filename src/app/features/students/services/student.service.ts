import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../../../shared/models/paged-response.model';
import {
  ApiResponse,
  CreateStudentRequest,
  UpdateStudentRequest,
  StudentResponse,
  StudentStatus,
} from '../models/student.models';

@Injectable({ providedIn: 'root' })
export class StudentService {
  private readonly http = inject(HttpClient);
  private readonly api  = `${environment.apiUrl}/students`;

  getAll(page = 0, size = 20): Observable<PagedResponse<StudentResponse>> {
    return this.http
      .get<ApiResponse<PagedResponse<StudentResponse>>>(this.api, {
        params: { page: String(page), size: String(size) }
      })
      .pipe(map(r => r.data));
  }

  getByClass(className: string): Observable<StudentResponse[]> {
    return this.http
      .get<ApiResponse<StudentResponse[]>>(`${this.api}/class/${className}`)
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<StudentResponse> {
    return this.http
      .get<ApiResponse<StudentResponse>>(`${this.api}/${id}`)
      .pipe(map(r => r.data));
  }

  create(payload: CreateStudentRequest): Observable<StudentResponse> {
    return this.http
      .post<ApiResponse<StudentResponse>>(this.api, payload)
      .pipe(map(r => r.data));
  }

  update(id: number, payload: UpdateStudentRequest): Observable<StudentResponse> {
    return this.http
      .put<ApiResponse<StudentResponse>>(`${this.api}/${id}`, payload)
      .pipe(map(r => r.data));
  }

  updateStatus(id: number, status: StudentStatus): Observable<StudentResponse> {
    const params = new HttpParams().set('status', status);
    return this.http
      .patch<ApiResponse<StudentResponse>>(`${this.api}/${id}/status`, {}, { params })
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
