import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../../../shared/models/paged-response.model';
import {
  MarkAttendanceRequest,
  BulkMarkAttendanceRequest,
  AttendanceResponse,
  AttendanceSummaryResponse,
} from '../models/attendance.models';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private readonly http = inject(HttpClient);
  private readonly api  = `${environment.apiUrl}/attendance`;

  markAttendance(payload: MarkAttendanceRequest): Observable<AttendanceResponse> {
    return this.http
      .post<ApiEnvelope<AttendanceResponse>>(this.api, payload)
      .pipe(map(r => r.data));
  }

  bulkMarkAttendance(payload: BulkMarkAttendanceRequest): Observable<AttendanceResponse[]> {
    return this.http
      .post<ApiEnvelope<AttendanceResponse[]>>(`${this.api}/bulk`, payload)
      .pipe(map(r => r.data));
  }

  getAttendanceById(id: number): Observable<AttendanceResponse> {
    return this.http
      .get<ApiEnvelope<AttendanceResponse>>(`${this.api}/${id}`)
      .pipe(map(r => r.data));
  }

  getAttendanceByStudent(
    studentId: number,
    termId: number,
    page = 0,
    size = 20
  ): Observable<PagedResponse<AttendanceResponse>> {
    return this.http
      .get<ApiEnvelope<PagedResponse<AttendanceResponse>>>(
        `${this.api}/student/${studentId}/term/${termId}`,
        { params: { page: String(page), size: String(size) } }
      )
      .pipe(map(r => r.data));
  }

  getAttendanceByClassroom(
    classroomId: number,
    date: string,
    page = 0,
    size = 200
  ): Observable<PagedResponse<AttendanceResponse>> {
    return this.http
      .get<ApiEnvelope<PagedResponse<AttendanceResponse>>>(
        `${this.api}/classroom/${classroomId}/date/${date}`,
        { params: { page: String(page), size: String(size) } }
      )
      .pipe(map(r => r.data));
  }

  getAttendanceByClassroomAndDateRange(
    classroomId: number,
    from: string,
    to: string
  ): Observable<AttendanceResponse[]> {
    return this.http
      .get<ApiEnvelope<AttendanceResponse[]>>(
        `${this.api}/classroom/${classroomId}/range`,
        { params: { from, to } }
      )
      .pipe(map(r => r.data));
  }

  updateAttendance(id: number, payload: MarkAttendanceRequest): Observable<AttendanceResponse> {
    return this.http
      .put<ApiEnvelope<AttendanceResponse>>(`${this.api}/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteAttendance(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<null>>(`${this.api}/${id}`)
      .pipe(map(() => void 0));
  }

  getStudentSummary(
    studentId: number,
    termId: number
  ): Observable<AttendanceSummaryResponse> {
    return this.http
      .get<ApiEnvelope<AttendanceSummaryResponse>>(
        `${this.api}/student/${studentId}/term/${termId}/summary`
      )
      .pipe(map(r => r.data));
  }

  getClassroomSummary(
    classroomId: number,
    termId: number
  ): Observable<AttendanceSummaryResponse> {
    return this.http
      .get<ApiEnvelope<AttendanceSummaryResponse>>(
        `${this.api}/classroom/${classroomId}/term/${termId}/summary`
      )
      .pipe(map(r => r.data));
  }
}
