import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {environment} from '../../../../environments/environment';
import {PagedResponse} from '../../../shared/models/paged-response.model';
import {
  FeePlanRequest, FeePlanResponse, FeeTypeRequest, FeeTypeResponse,
  GenerateInvoiceRequest, InvoiceResponse, PaymentRequest, PaymentResponse,
  StudentBalanceResponse
} from '../models/fee.models';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({providedIn: 'root'})
export class FeeService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/fees`;

  // ── Fee Types ─────────────────────────────────────────────
  createFeeType(payload: FeeTypeRequest): Observable<FeeTypeResponse> {
    return this.http.post<ApiEnvelope<FeeTypeResponse>>(`${this.api}/types`, payload)
      .pipe(map(r => r.data));
  }

  getFeeTypes(page = 0, size = 20): Observable<PagedResponse<FeeTypeResponse>> {
    return this.http.get<ApiEnvelope<PagedResponse<FeeTypeResponse>>>(`${this.api}/types?page=${page}&size=${size}`)
      .pipe(map(r => r.data));
  }

  getActiveFeeTypes(): Observable<FeeTypeResponse[]> {
    return this.http.get<ApiEnvelope<FeeTypeResponse[]>>(`${this.api}/types/active`)
      .pipe(map(r => r.data));
  }

  updateFeeType(id: number, payload: FeeTypeRequest): Observable<FeeTypeResponse> {
    return this.http.put<ApiEnvelope<FeeTypeResponse>>(`${this.api}/types/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteFeeType(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<void>>(`${this.api}/types/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Fee Plans ─────────────────────────────────────────────
  createFeePlan(payload: FeePlanRequest): Observable<FeePlanResponse> {
    return this.http.post<ApiEnvelope<FeePlanResponse>>(`${this.api}/plans`, payload)
      .pipe(map(r => r.data));
  }

  getFeePlans(page = 0, size = 20): Observable<PagedResponse<FeePlanResponse>> {
    return this.http.get<ApiEnvelope<PagedResponse<FeePlanResponse>>>(`${this.api}/plans?page=${page}&size=${size}`)
      .pipe(map(r => r.data));
  }

  getFeePlansByClassroom(classroomId: number): Observable<FeePlanResponse[]> {
    return this.http.get<ApiEnvelope<FeePlanResponse[]>>(`${this.api}/plans/classroom/${classroomId}`)
      .pipe(map(r => r.data));
  }

  getFeePlansByClassroomAndTerm(classroomId: number, termId: number, sessionId: number): Observable<FeePlanResponse[]> {
    return this.http.get<ApiEnvelope<FeePlanResponse[]>>(
      `${this.api}/plans/classroom/${classroomId}/term/${termId}/session/${sessionId}`)
      .pipe(map(r => r.data));
  }

  updateFeePlan(id: number, payload: FeePlanRequest): Observable<FeePlanResponse> {
    return this.http.put<ApiEnvelope<FeePlanResponse>>(`${this.api}/plans/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteFeePlan(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<void>>(`${this.api}/plans/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Invoices ──────────────────────────────────────────────
  generateInvoices(payload: GenerateInvoiceRequest): Observable<InvoiceResponse[]> {
    return this.http.post<ApiEnvelope<InvoiceResponse[]>>(`${this.api}/invoices/generate`, payload)
      .pipe(map(r => r.data));
  }

  getInvoice(id: number): Observable<InvoiceResponse> {
    return this.http.get<ApiEnvelope<InvoiceResponse>>(`${this.api}/invoices/${id}`)
      .pipe(map(r => r.data));
  }

  getInvoices(page = 0, size = 20): Observable<PagedResponse<InvoiceResponse>> {
    return this.http.get<ApiEnvelope<PagedResponse<InvoiceResponse>>>(`${this.api}/invoices?page=${page}&size=${size}`)
      .pipe(map(r => r.data));
  }

  getInvoicesByStudent(studentId: number, page = 0, size = 20): Observable<PagedResponse<InvoiceResponse>> {
    return this.http.get<ApiEnvelope<PagedResponse<InvoiceResponse>>>(
      `${this.api}/invoices/student/${studentId}?page=${page}&size=${size}`)
      .pipe(map(r => r.data));
  }

  getStudentBalance(studentId: number): Observable<StudentBalanceResponse> {
    return this.http.get<ApiEnvelope<StudentBalanceResponse>>(`${this.api}/invoices/student/${studentId}/balance`)
      .pipe(map(r => r.data));
  }

  deleteInvoice(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<void>>(`${this.api}/invoices/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Payments ──────────────────────────────────────────────
  recordPayment(payload: PaymentRequest): Observable<PaymentResponse> {
    return this.http.post<ApiEnvelope<PaymentResponse>>(`${this.api}/payments`, payload)
      .pipe(map(r => r.data));
  }

  getPayments(page = 0, size = 20): Observable<PagedResponse<PaymentResponse>> {
    return this.http.get<ApiEnvelope<PagedResponse<PaymentResponse>>>(`${this.api}/payments?page=${page}&size=${size}`)
      .pipe(map(r => r.data));
  }

  getPaymentsByInvoice(invoiceId: number): Observable<PaymentResponse[]> {
    return this.http.get<ApiEnvelope<PaymentResponse[]>>(`${this.api}/payments/invoice/${invoiceId}`)
      .pipe(map(r => r.data));
  }

  getPaymentsByDateRange(from: string, to: string, page = 0, size = 20): Observable<PagedResponse<PaymentResponse>> {
    return this.http.get<ApiEnvelope<PagedResponse<PaymentResponse>>>(
      `${this.api}/payments/range?from=${from}&to=${to}&page=${page}&size=${size}`)
      .pipe(map(r => r.data));
  }

  deletePayment(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<void>>(`${this.api}/payments/${id}`)
      .pipe(map(r => r.data));
  }
}
