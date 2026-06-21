import {ChangeDetectionStrategy, Component, inject, OnInit, signal, computed} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FeeService} from '../../services/fee.service';
import {AcademicService} from '../../../academics/services/academic.service';
import {AuthService} from '../../../../core/auth/services/auth.service';
import {TokenService} from '../../../../core/auth/services/token.service';
import {StudentService} from '../../../students/services/student.service';
import {InvoiceResponse, InvoiceStatus, INVOICE_STATUS_OPTIONS, PaymentMode, PAYMENT_MODE_OPTIONS, PaymentRequest, FeePlanResponse} from '../../models/fee.models';
import {ClassroomResponse, SessionResponse, TermResponse} from '../../../academics/models/academic.model';
import {SchoolResponse, UserRole} from '../../../../core/auth/models/auth.model';
import { jsPDF } from 'jspdf';

@Component({
  selector: 'app-invoice-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './invoice-list.html',
  styleUrl: './invoice-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceList implements OnInit {
  private readonly feeService = inject(FeeService);
  private readonly academicService = inject(AcademicService);
  private readonly authService = inject(AuthService);
  private readonly tokenService = inject(TokenService);
  private readonly studentService = inject(StudentService);

  readonly invoices = signal<InvoiceResponse[]>([]);
  readonly classrooms = signal<ClassroomResponse[]>([]);
  readonly terms = signal<TermResponse[]>([]);
  readonly feePlans = signal<FeePlanResponse[]>([]);
  readonly currentSession = signal<SessionResponse | null>(null);
  readonly schoolInfo = signal<SchoolResponse | null>(null);
  readonly isLoading = signal(false);
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedClassroomId = signal<number | null>(null);
  readonly selectedTermId = signal<number | null>(null);
  readonly statusFilter = signal<InvoiceStatus | null>(null);

  readonly showGenerateForm = signal(false);
  readonly showPaymentForm = signal(false);
  readonly isGenerating = signal(false);
  readonly isSavingPayment = signal(false);
  readonly paymentInvoiceId = signal<number | null>(null);

  readonly generateSelectedPlanIds = signal<number[]>([]);
  readonly paymentAmount = signal<number>(0);
  readonly paymentMode = signal<PaymentMode>('CASH');
  readonly paymentReference = signal('');
  readonly paymentDate = signal(new Date().toISOString().split('T')[0]);

  readonly statusOptions = INVOICE_STATUS_OPTIONS;
  readonly paymentModeOptions = PAYMENT_MODE_OPTIONS;

  readonly selectedInvoice = signal<InvoiceResponse | null>(null);
  readonly showInvoiceDetail = signal(false);

  readonly userRole = computed(() => this.tokenService.currentRole());
  readonly isStudentView = computed(() => this.userRole() === 'STUDENT');
  readonly isParentView = computed(() => this.userRole() === 'PARENT');
  readonly isStudentOrParentView = computed(() => this.isStudentView() || this.isParentView());

  ngOnInit(): void {
    this.authService.getMySchool().subscribe({ next: school => this.schoolInfo.set(school) });
    if (this.isStudentOrParentView()) {
      this.loadStudentInvoices();
    } else {
      this.loadClassroomsAndTerms();
    }
  }

  private loadClassroomsAndTerms(): void {
    this.academicService.getClassrooms(0, 100).subscribe({ next: res => this.classrooms.set(res.content) });
    this.academicService.getSessions(0, 20).subscribe({
      next: res => {
        const s = res.content.find(x => x.status === 'ACTIVE') ?? res.content[0];
        this.currentSession.set(s ?? null);
        if (s) this.academicService.getTermsBySession(s.id).subscribe({ next: (t: any[]) => this.terms.set(t) });
      },
    });
  }

  private loadStudentInvoices(): void {
    this.isLoading.set(true);
    this.studentService.getMyProfile().subscribe({
      next: profile => {
        this.feeService.getInvoicesByStudent(profile.id, 0, 100).subscribe({
          next: res => { this.invoices.set(res.content); this.isLoading.set(false); },
          error: () => this.isLoading.set(false),
        });
      },
      error: () => this.isLoading.set(false),
    });
  }

  private loadInvoices(): void {
    this.isLoading.set(true);
    this.feeService.getInvoices(0, 100).subscribe({
      next: res => { this.invoices.set(res.content); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  onClassChange(classroomId: number | null): void {
    this.selectedClassroomId.set(classroomId);
    if (classroomId !== null) {
      this.loadInvoices();
    } else {
      this.invoices.set([]);
    }
  }

  openGenerate(): void {
    this.selectedClassroomId();
    const classId = this.selectedClassroomId();
    const termId = this.selectedTermId();
    if (!classId || !termId) { this.errorMessage.set('Select a class and term first'); setTimeout(() => this.errorMessage.set(null), 3000); return; }
    const sessId = this.currentSession()?.id;
    if (!sessId) return;
    this.feeService.getFeePlansByClassroomAndTerm(classId, termId, sessId).subscribe({
      next: plans => { this.feePlans.set(plans); this.generateSelectedPlanIds.set(plans.map(p => p.id)); this.showGenerateForm.set(true); },
    });
  }

  togglePlanSelection(planId: number): void {
    this.generateSelectedPlanIds.update(ids =>
      ids.includes(planId) ? ids.filter(i => i !== planId) : [...ids, planId]
    );
  }

  generate(): void {
    const classId = this.selectedClassroomId();
    const termId = this.selectedTermId();
    const sessId = this.currentSession()?.id;
    if (!classId || !termId || !sessId || this.generateSelectedPlanIds().length === 0) return;
    this.isGenerating.set(true);
    this.feeService.generateInvoices({ classroomId: classId, sessionId: sessId, termId, feePlanIds: this.generateSelectedPlanIds() }).subscribe({
      next: () => {
        this.successMessage.set('Invoices generated');
        this.isGenerating.set(false);
        this.showGenerateForm.set(false);
        this.loadInvoices();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => { this.errorMessage.set(err.error?.message ?? 'Failed'); this.isGenerating.set(false); },
    });
  }

  openPayment(invoice: InvoiceResponse): void {
    this.paymentInvoiceId.set(invoice.id);
    this.paymentAmount.set(invoice.balance);
    this.paymentMode.set('CASH');
    this.paymentReference.set('');
    this.paymentDate.set(new Date().toISOString().split('T')[0]);
    this.showPaymentForm.set(true);
  }

  submitPayment(): void {
    const invoiceId = this.paymentInvoiceId();
    if (!invoiceId || !this.paymentAmount()) return;
    this.isSavingPayment.set(true);
    const payload: PaymentRequest = {
      invoiceId,
      amount: this.paymentAmount(),
      paymentMode: this.paymentMode(),
      reference: this.paymentReference() || undefined,
      paymentDate: this.paymentDate(),
    };
    this.feeService.recordPayment(payload).subscribe({
      next: () => {
        this.successMessage.set('Payment recorded');
        this.isSavingPayment.set(false);
        this.showPaymentForm.set(false);
        this.loadInvoices();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (err) => { this.errorMessage.set(err.error?.message ?? 'Failed'); this.isSavingPayment.set(false); },
    });
  }

  viewInvoice(invoice: InvoiceResponse): void {
    this.selectedInvoice.set(invoice);
    this.showInvoiceDetail.set(true);
  }

  closeDetail(): void { this.showInvoiceDetail.set(false); this.selectedInvoice.set(null); }

  exportPdf(invoice: InvoiceResponse): void {
    const school = this.schoolInfo();
    const schoolName = school?.name ?? 'School';
    const logoUrl = school?.logoUrl;

    if (logoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        this.generatePdf(invoice, schoolName, dataUrl);
      };
      img.onerror = () => this.generatePdf(invoice, schoolName);
      img.src = logoUrl;
    } else {
      this.generatePdf(invoice, schoolName);
    }
  }

  private generatePdf(invoice: InvoiceResponse, schoolName: string, logoDataUrl?: string): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const school = this.schoolInfo();
    const accent: [number, number, number] = [20, 158, 117];
    const dark: [number, number, number] = [30, 30, 40];
    const gray: [number, number, number] = [120, 120, 130];
    const lightGray: [number, number, number] = [245, 245, 248];
    const white: [number, number, number] = [255, 255, 255];

    // ── Header bar ──
    doc.setFillColor(...accent);
    doc.rect(0, 0, pageWidth, 42, 'F');

    let textStartX = margin;
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, 8, 22, 22);
      textStartX = margin + 28;
    }

    doc.setTextColor(...white);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolName, textStartX, 18);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('INVOICE', textStartX, 26);
    if (school?.address) {
      doc.setFontSize(8);
      doc.text(school.address, textStartX, 33);
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.invoiceNo, pageWidth - margin, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, pageWidth - margin, 25, { align: 'right' });

    // Status badge
    const statusColors: Record<string, [number, number, number]> = {
      PENDING: [148, 163, 184], PARTIAL: [234, 179, 8], PAID: [22, 163, 74],
      OVERDUE: [220, 38, 38], CANCELLED: [148, 163, 184],
    };
    const statusColor = statusColors[invoice.status] ?? gray;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const statusW = doc.getTextWidth(invoice.status) + 8;
    doc.setFillColor(...statusColor);
    doc.roundedRect(pageWidth - margin - statusW, 29, statusW, 8, 2, 2, 'F');
    doc.setTextColor(...white);
    doc.text(invoice.status, pageWidth - margin - statusW / 2, 34.5, { align: 'center' });

    doc.setTextColor(...dark);

    // ── Info boxes ──
    let y = 54;
    const boxW = (pageWidth - margin * 2 - 8) / 2;

    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, y - 3, boxW, 38, 3, 3, 'F');
    doc.roundedRect(margin + boxW + 8, y - 3, boxW, 38, 3, 3, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.text('BILL TO', margin + 6, y + 3);
    doc.setTextColor(...dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.studentName, margin + 6, y + 11);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text(`Admission: ${invoice.admissionNumber}`, margin + 6, y + 18);
    doc.text(`Class: ${invoice.currentClass}`, margin + 6, y + 25);

    const rightX = margin + boxW + 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.text('INVOICE INFO', rightX + 6, y + 3);
    doc.setTextColor(...gray);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`Term: ${invoice.termName}`, rightX + 6, y + 11);
    doc.text(`Session: ${invoice.sessionName}`, rightX + 6, y + 18);
    doc.text(`Issued: ${new Date(invoice.createdAt).toLocaleDateString()}`, rightX + 6, y + 25);

    doc.setTextColor(...dark);
    y += 48;

    // ── Table ──
    doc.setFillColor(...accent);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 9, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text('S/N', margin + 6, y + 6);
    doc.text('FEE TYPE', margin + 18, y + 6);
    doc.text('AMOUNT', pageWidth - margin - 6, y + 6, { align: 'right' });
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (let i = 0; i < invoice.items.length; i++) {
      const item = invoice.items[i];
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 252);
        doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
      }
      doc.setTextColor(...gray);
      doc.text(`${i + 1}`, margin + 6, y + 6);
      doc.setTextColor(...dark);
      doc.text(item.feeTypeName, margin + 18, y + 6);
      doc.text(item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 }), pageWidth - margin - 6, y + 6, { align: 'right' });
      y += 10;
    }

    // ── Totals ──
    y += 6;
    const totalsX = pageWidth - margin - 70;

    doc.setDrawColor(...accent);
    doc.setLineWidth(0.5);
    doc.line(totalsX, y, pageWidth - margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('Subtotal', totalsX, y);
    doc.text(invoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }), pageWidth - margin, y, { align: 'right' });
    y += 6;

    if (invoice.paidAmount > 0) {
      doc.setTextColor(22, 163, 74);
      doc.text('Paid', totalsX, y);
      doc.text(`-${invoice.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, pageWidth - margin, y, { align: 'right' });
      y += 6;
    }

    doc.setFillColor(...accent);
    doc.roundedRect(totalsX - 4, y - 4, 74, 11, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...white);
    doc.text('BALANCE DUE', totalsX, y + 3);
    doc.text(invoice.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }), pageWidth - margin, y + 3, { align: 'right' });

    // ── Footer ──
    doc.setDrawColor(220);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('This invoice was generated by skooLLy School Management System', pageWidth / 2, pageHeight - 17, { align: 'center' });
    doc.text(`School: ${schoolName} | ${school?.phoneNumber ?? ''} | ${school?.email ?? ''}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.setFillColor(...accent);
    doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

    doc.save(`${invoice.invoiceNo}.pdf`);
  }

  statusBadge(status: InvoiceStatus): string {
    const map: Record<string, string> = { PENDING: 'badge--slate', PARTIAL: 'badge--amber', PAID: 'badge--green', OVERDUE: 'badge--coral', CANCELLED: 'badge--slate' };
    return map[status] ?? '';
  }

  readonly availableClasses = () => {
    const invoiceClasses = new Set(this.invoices().map(i => i.currentClass?.trim().toLowerCase()).filter(Boolean));
    return this.classrooms().filter(c => invoiceClasses.has(c.name.trim().toLowerCase()));
  };

  filteredInvoices = () => {
    let list = this.invoices();
    const c = this.selectedClassroomId();
    const t = this.selectedTermId();
    const s = this.statusFilter();
    if (c !== null) {
      const classroom = this.classrooms().find(cl => cl.id === c);
      if (classroom) {
        const name = classroom.name.trim().toLowerCase();
        list = list.filter(i => i.currentClass?.trim().toLowerCase().startsWith(name));
      }
    }
    if (t !== null) list = list.filter(i => i.termId === t);
    if (s !== null) list = list.filter(i => i.status === s);
    return list;
  };
}
