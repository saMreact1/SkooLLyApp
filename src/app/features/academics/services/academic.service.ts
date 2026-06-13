import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  CreateSessionRequest,   SessionResponse,
  CreateTermRequest,      TermResponse,
  CreateSubjectRequest,   UpdateSubjectRequest,   SubjectResponse,
  CreateClassroomRequest, UpdateClassroomRequest, ClassroomResponse,
  CreateTimetableRequest, TimetableResponse,
} from '../models/academic.model';

@Injectable({ providedIn: 'root' })
export class AcademicService {
  private readonly http = inject(HttpClient);
  private readonly api  = `${environment.apiUrl}/academic`;

  // Sessions

  createSession(payload: CreateSessionRequest): Observable<SessionResponse> {
    return this.http
      .post<ApiResponse<SessionResponse>>(`${this.api}/sessions`, payload)
      .pipe(map(r => r.data));
  }

  getSessions(): Observable<SessionResponse[]> {
    return this.http
      .get<ApiResponse<SessionResponse[]>>(`${this.api}/sessions`)
      .pipe(map(r => r.data));
  }

  getSessionById(id: number): Observable<SessionResponse> {
    return this.http
      .get<ApiResponse<SessionResponse>>(`${this.api}/sessions/${id}`)
      .pipe(map(r => r.data));
  }

  getCurrentSession(): Observable<SessionResponse> {
    return this.http
      .get<ApiResponse<SessionResponse>>(`${this.api}/sessions/current`)
      .pipe(map(r => r.data));
  }

  setCurrentSession(id: number): Observable<SessionResponse> {
    return this.http
      .patch<ApiResponse<SessionResponse>>(
        `${this.api}/sessions/${id}/current`, {}
      )
      .pipe(map(r => r.data));
  }

  deleteSession(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.api}/sessions/${id}`)
      .pipe(map(() => void 0));
  }

  // Terms

  createTerm(payload: CreateTermRequest): Observable<TermResponse> {
    return this.http
      .post<ApiResponse<TermResponse>>(`${this.api}/terms`, payload)
      .pipe(map(r => r.data));
  }

  getTermById(id: number): Observable<TermResponse> {
    return this.http
      .get<ApiResponse<TermResponse>>(`${this.api}/terms/${id}`)
      .pipe(map(r => r.data));
  }

  getTermsBySession(sessionId: number): Observable<TermResponse[]> {
    return this.http
      .get<ApiResponse<TermResponse[]>>(
        `${this.api}/sessions/${sessionId}/terms`
      )
      .pipe(map(r => r.data));
  }

  getCurrentTerm(): Observable<TermResponse> {
    return this.http
      .get<ApiResponse<TermResponse>>(`${this.api}/terms/current`)
      .pipe(map(r => r.data));
  }

  setCurrentTerm(id: number): Observable<TermResponse> {
    return this.http
      .patch<ApiResponse<TermResponse>>(
        `${this.api}/terms/${id}/current`, {}
      )
      .pipe(map(r => r.data));
  }

  deleteTerm(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.api}/terms/${id}`)
      .pipe(map(() => void 0));
  }

  // Subjects

  createSubject(payload: CreateSubjectRequest): Observable<SubjectResponse> {
    const body = { ...payload, elective: payload.isElective };
    return this.http
      .post<ApiResponse<Record<string, unknown>>>(`${this.api}/subjects`, body)
      .pipe(map(r => this.mapSubject(r.data)));
  }

  private mapSubject = (s: Record<string, unknown>): SubjectResponse => ({
    ...s,
    isElective: !!(s['elective'] ?? s['isElective'] ?? s['is_elective']),
  }) as SubjectResponse;

  getSubjects(): Observable<SubjectResponse[]> {
    return this.http
      .get<ApiResponse<Record<string, unknown>[]>>(`${this.api}/subjects`)
      .pipe(map(r => r.data.map(this.mapSubject)));
  }

  getSubjectById(id: number): Observable<SubjectResponse> {
    return this.http
      .get<ApiResponse<Record<string, unknown>>>(`${this.api}/subjects/${id}`)
      .pipe(map(r => this.mapSubject(r.data)));
  }

  getElectiveSubjects(): Observable<SubjectResponse[]> {
    return this.http
      .get<ApiResponse<Record<string, unknown>[]>>(`${this.api}/subjects/electives`)
      .pipe(map(r => r.data.map(this.mapSubject)));
  }

  updateSubject(
    id: number,
    payload: UpdateSubjectRequest
  ): Observable<SubjectResponse> {
    const body = { ...payload, elective: payload.isElective };
    return this.http
      .put<ApiResponse<Record<string, unknown>>>(
        `${this.api}/subjects/${id}`, body
      )
      .pipe(map(r => this.mapSubject(r.data)));
  }

  deleteSubject(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.api}/subjects/${id}`)
      .pipe(map(() => void 0));
  }

  // Classrooms

  createClassroom(
    payload: CreateClassroomRequest
  ): Observable<ClassroomResponse> {
    return this.http
      .post<ApiResponse<ClassroomResponse>>(
        `${this.api}/classrooms`, payload
      )
      .pipe(map(r => r.data));
  }

  getClassrooms(): Observable<ClassroomResponse[]> {
    return this.http
      .get<ApiResponse<ClassroomResponse[]>>(`${this.api}/classrooms`)
      .pipe(map(r => r.data));
  }

  getClassroomById(id: number): Observable<ClassroomResponse> {
    return this.http
      .get<ApiResponse<ClassroomResponse>>(
        `${this.api}/classrooms/${id}`
      )
      .pipe(map(r => r.data));
  }

  getClassroomsByLevel(level: string): Observable<ClassroomResponse[]> {
    return this.http
      .get<ApiResponse<ClassroomResponse[]>>(
        `${this.api}/classrooms/level/${level}`
      )
      .pipe(map(r => r.data));
  }

  updateClassroom(
    id: number,
    payload: UpdateClassroomRequest
  ): Observable<ClassroomResponse> {
    return this.http
      .put<ApiResponse<ClassroomResponse>>(
        `${this.api}/classrooms/${id}`, payload
      )
      .pipe(map(r => r.data));
  }

  deleteClassroom(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.api}/classrooms/${id}`)
      .pipe(map(() => void 0));
  }

  getClassroomCount(): Observable<number> {
    return this.http
      .get<ApiResponse<number>>(`${this.api}/classrooms/count`)
      .pipe(map(r => r.data));
  }

  // Timetable

  createTimetableEntry(
    payload: CreateTimetableRequest
  ): Observable<TimetableResponse> {
    return this.http
      .post<ApiResponse<TimetableResponse>>(
        `${this.api}/timetable`, payload
      )
      .pipe(map(r => r.data));
  }

  getTimetableByTerm(termId: number): Observable<TimetableResponse[]> {
    return this.http
      .get<ApiResponse<TimetableResponse[]>>(
        `${this.api}/timetable/term/${termId}`
      )
      .pipe(map(r => r.data));
  }

  getTimetableByClassroom(
    classroomId: number,
    termId: number
  ): Observable<TimetableResponse[]> {
    return this.http
      .get<ApiResponse<TimetableResponse[]>>(
        `${this.api}/timetable/classroom/${classroomId}/term/${termId}`
      )
      .pipe(map(r => r.data));
  }

  getTimetableByTeacher(
    teacherId: number,
    termId: number
  ): Observable<TimetableResponse[]> {
    return this.http
      .get<ApiResponse<TimetableResponse[]>>(
        `${this.api}/timetable/teacher/${teacherId}/term/${termId}`
      )
      .pipe(map(r => r.data));
  }

  deleteTimetableEntry(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.api}/timetable/${id}`)
      .pipe(map(() => void 0));
  }
}
