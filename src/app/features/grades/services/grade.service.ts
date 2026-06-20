import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../../../shared/models/paged-response.model';
import {
  ExamRequest,
  ExamResponse,
  GradeRequest,
  GradeResponse,
  BulkGradeRequest,
  GradeSheetResponse,
  ReportCardResponse,
  GradingScaleResponse,
} from '../models/grade.models';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class GradeService {
  private readonly http = inject(HttpClient);
  private readonly examApi = `${environment.apiUrl}/exams`;
  private readonly gradeApi = `${environment.apiUrl}/grades`;
  private readonly scaleApi = `${environment.apiUrl}/grading-scales`;

  // ─── Exams ──────────────────────────────────────────────────────────

  createExam(payload: ExamRequest): Observable<ExamResponse> {
    return this.http
      .post<ApiEnvelope<ExamResponse>>(this.examApi, payload)
      .pipe(map(r => r.data));
  }

  getExamById(id: number): Observable<ExamResponse> {
    return this.http
      .get<ApiEnvelope<ExamResponse>>(`${this.examApi}/${id}`)
      .pipe(map(r => r.data));
  }

  getExams(page = 0, size = 20): Observable<PagedResponse<ExamResponse>> {
    return this.http
      .get<ApiEnvelope<PagedResponse<ExamResponse>>>(this.examApi, { params: { page: String(page), size: String(size) } })
      .pipe(map(r => r.data));
  }

  getExamsByClassroom(classroomId: number, page = 0, size = 20): Observable<PagedResponse<ExamResponse>> {
    return this.http
      .get<ApiEnvelope<PagedResponse<ExamResponse>>>(`${this.examApi}/classroom/${classroomId}`, { params: { page: String(page), size: String(size) } })
      .pipe(map(r => r.data));
  }

  getExamsByTerm(termId: number, page = 0, size = 20): Observable<PagedResponse<ExamResponse>> {
    return this.http
      .get<ApiEnvelope<PagedResponse<ExamResponse>>>(`${this.examApi}/term/${termId}`, { params: { page: String(page), size: String(size) } })
      .pipe(map(r => r.data));
  }

  updateExam(id: number, payload: ExamRequest): Observable<ExamResponse> {
    return this.http
      .put<ApiEnvelope<ExamResponse>>(`${this.examApi}/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteExam(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<null>>(`${this.examApi}/${id}`)
      .pipe(map(() => void 0));
  }

  // ─── Grades ──────────────────────────────────────────────────────────

  addGrade(payload: GradeRequest): Observable<GradeResponse> {
    return this.http
      .post<ApiEnvelope<GradeResponse>>(this.gradeApi, payload)
      .pipe(map(r => r.data));
  }

  bulkAddGrades(payload: BulkGradeRequest): Observable<GradeResponse[]> {
    return this.http
      .post<ApiEnvelope<GradeResponse[]>>(`${this.gradeApi}/bulk`, payload)
      .pipe(map(r => r.data));
  }

  getGradesByExam(examId: number, page = 0, size = 50): Observable<PagedResponse<GradeResponse>> {
    return this.http
      .get<ApiEnvelope<PagedResponse<GradeResponse>>>(`${this.gradeApi}/exam/${examId}`, { params: { page: String(page), size: String(size) } })
      .pipe(map(r => r.data));
  }

  getGradesByStudent(studentId: number, page = 0, size = 20): Observable<PagedResponse<GradeResponse>> {
    return this.http
      .get<ApiEnvelope<PagedResponse<GradeResponse>>>(`${this.gradeApi}/student/${studentId}`, { params: { page: String(page), size: String(size) } })
      .pipe(map(r => r.data));
  }

  getGradeSheet(examId: number): Observable<GradeSheetResponse> {
    return this.http
      .get<ApiEnvelope<GradeSheetResponse>>(`${this.gradeApi}/sheet/${examId}`)
      .pipe(map(r => r.data));
  }

  updateGrade(id: number, payload: GradeRequest): Observable<GradeResponse> {
    return this.http
      .put<ApiEnvelope<GradeResponse>>(`${this.gradeApi}/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteGrade(id: number): Observable<void> {
    return this.http
      .delete<ApiEnvelope<null>>(`${this.gradeApi}/${id}`)
      .pipe(map(() => void 0));
  }

  // ─── Grading Scales & Report Card ────────────────────────────────────

  getGradingScales(): Observable<GradingScaleResponse[]> {
    return this.http
      .get<ApiEnvelope<GradingScaleResponse[]>>(this.scaleApi)
      .pipe(map(r => r.data));
  }

  getReportCard(studentId: number, termId: number): Observable<ReportCardResponse> {
    return this.http
      .get<ApiEnvelope<ReportCardResponse>>(`${this.scaleApi}/report-card/student/${studentId}/term/${termId}`)
      .pipe(map(r => r.data));
  }
}
