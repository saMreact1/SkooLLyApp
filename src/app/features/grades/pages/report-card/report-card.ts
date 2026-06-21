import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ReportCardResponse} from '../../models/grade.models';
import {GradeService} from '../../services/grade.service';
import {AcademicService} from '../../../academics/services/academic.service';
import {StudentService} from '../../../students/services/student.service';
import {TokenService} from '../../../../core/auth/services/token.service';
import {AuthService} from '../../../../core/auth/services/auth.service';
import {StudentResponse} from '../../../students/models/student.models';
import {ClassroomResponse, TermResponse} from '../../../academics/models/academic.model';
import {SchoolResponse} from '../../../../core/auth/models/auth.model';
import {jsPDF} from 'jspdf';

@Component({
  selector: 'app-report-card',
  imports: [CommonModule, FormsModule],
  templateUrl: './report-card.html',
  styleUrl: './report-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportCard implements OnInit {
  private readonly gradeService = inject(GradeService);
  private readonly academicService = inject(AcademicService);
  private readonly studentService = inject(StudentService);
  private readonly tokens = inject(TokenService);
  private readonly authService = inject(AuthService);

  readonly classrooms = signal<ClassroomResponse[]>([]);
  readonly terms = signal<TermResponse[]>([]);
  readonly studentsInClass = signal<StudentResponse[]>([]);
  readonly selectedClassroomId = signal<number | null>(null);
  readonly selectedStudentId = signal<number | null>(null);
  readonly selectedTermId = signal<number | null>(null);
  readonly reportCard = signal<ReportCardResponse | null>(null);
  readonly showReport = signal(false);
  readonly isLoadingStudents = signal(false);
  readonly isLoadingReport = signal(false);
  readonly schoolInfo = signal<SchoolResponse | null>(null);

  readonly isStudent = computed(() => this.tokens.currentRole() === 'STUDENT');
  readonly hasReport = computed(() => this.reportCard() !== null);

  ngOnInit(): void {
    this.authService.getMySchool().subscribe({ next: school => this.schoolInfo.set(school) });
    if (this.isStudent()) {
      this.studentService.getMyProfile().subscribe({
        next: profile => {
          this.selectedStudentId.set(profile.id);
        },
      });
      this.academicService.getCurrentSession().subscribe({
        next: session => {
          if (session) {
            this.academicService.getTermsBySession(session.id).subscribe({
              next: terms => this.terms.set(terms),
            });
          }
        },
      });
    } else {
      this.loadClassrooms();
    }
  }

  private loadClassrooms(): void {
    this.academicService.getClassrooms(0, 100).subscribe({
      next: res => this.classrooms.set(res.content),
    });
    this.academicService.getCurrentSession().subscribe({
      next: session => {
        if (session) {
          this.academicService.getTermsBySession(session.id).subscribe({
            next: terms => this.terms.set(terms),
          });
        }
      },
    });
  }

  onClassroomChange(classroomId: number): void {
    this.selectedClassroomId.set(classroomId);
    this.selectedStudentId.set(null);
    this.reportCard.set(null);
    this.showReport.set(false);
    const classroom = this.classrooms().find(c => c.id === classroomId);
    if (!classroom) return;

    this.isLoadingStudents.set(true);
    this.studentService.getAll(0, 500).subscribe({
      next: res => {
        const classroomName = (classroom.name ?? '').trim().toLowerCase();
        const filtered = res.content.filter((s: StudentResponse) => {
          const studentClass = (s.currentClass ?? '').trim().toLowerCase();
          return studentClass === classroomName || studentClass.startsWith(classroomName);
        });
        this.studentsInClass.set(filtered);
        this.isLoadingStudents.set(false);
      },
      error: () => this.isLoadingStudents.set(false),
    });
  }

  viewReport(studentId: number): void {
    this.selectedStudentId.set(studentId);
    const termId = this.selectedTermId();
    if (!termId) return;

    this.isLoadingReport.set(true);
    this.gradeService.getReportCard(studentId, termId).subscribe({
      next: report => {
        this.reportCard.set(report);
        this.showReport.set(true);
        this.isLoadingReport.set(false);
      },
      error: () => this.isLoadingReport.set(false),
    });
  }

  onTermChange(termId: number): void {
    this.selectedTermId.set(termId);
    if (this.isStudent()) {
      this.loadReport();
    }
  }

  loadReport(): void {
    const studentId = this.selectedStudentId();
    const termId = this.selectedTermId();
    if (!studentId || !termId) return;

    this.isLoadingReport.set(true);
    this.gradeService.getReportCard(studentId, termId).subscribe({
      next: report => {
        this.reportCard.set(report);
        this.showReport.set(true);
        this.isLoadingReport.set(false);
      },
      error: () => this.isLoadingReport.set(false),
    });
  }

  closeReport(): void {
    this.showReport.set(false);
    this.reportCard.set(null);
  }

  gradeClass(letter: string): string {
    if (!letter) return '';
    if (letter.startsWith('A')) return 'grade--a';
    if (letter.startsWith('B')) return 'grade--b';
    if (letter.startsWith('C')) return 'grade--c';
    if (letter === 'D') return 'grade--d';
    return 'grade--f';
  }

  exportPdf(): void {
    const report = this.reportCard();
    const school = this.schoolInfo();
    if (!report) return;
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
        this.generateReportPdf(report, schoolName, dataUrl);
      };
      img.onerror = () => this.generateReportPdf(report, schoolName);
      img.src = logoUrl;
    } else {
      this.generateReportPdf(report, schoolName);
    }
  }

  private generateReportPdf(report: ReportCardResponse, schoolName: string, logoDataUrl?: string): void {
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
    doc.text('ACADEMIC REPORT CARD', textStartX, 26);
    if (school?.address) {
      doc.setFontSize(8);
      doc.text(school.address, textStartX, 33);
    }

    // Session/Term on right
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${report.sessionName} — ${report.termName}`, pageWidth - margin, 18, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(report.classroomName, pageWidth - margin, 25, { align: 'right' });

    // Grade badge in header
    const gradeColors: Record<string, [number, number, number]> = {
      'A': [22, 163, 74], 'B': [37, 99, 235], 'C': [186, 117, 23],
      'D': [249, 115, 22], 'F': [220, 38, 38],
    };
    const gradeColor = gradeColors[report.overallGrade.charAt(0)] ?? gray;
    const badgeText = `Grade: ${report.overallGrade}`;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const badgeW = doc.getTextWidth(badgeText) + 8;
    doc.setFillColor(...gradeColor);
    doc.roundedRect(pageWidth - margin - badgeW, 29, badgeW, 8, 2, 2, 'F');
    doc.setTextColor(...white);
    doc.text(badgeText, pageWidth - margin - badgeW / 2, 34.5, { align: 'center' });

    doc.setTextColor(...dark);

    // ── Student info box ──
    let y = 52;
    const boxW = pageWidth - margin * 2;

    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, y, boxW, 22, 3, 3, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accent);
    doc.text('STUDENT DETAILS', margin + 6, y + 6);
    doc.setTextColor(...gray);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${report.studentName}`, margin + 6, y + 14);
    doc.text(`Admission No: ${report.admissionNumber}`, margin + 6 + 80, y + 14);

    y += 30;

    // ── Summary boxes ──
    const summaryItems = [
      { label: 'TOTAL MARKS', value: `${report.totalMarksObtained.toFixed(1)} / ${report.totalMaxMarks}` },
      { label: 'OVERALL %', value: `${report.overallPercentage.toFixed(1)}%` },
      { label: 'GRADE', value: report.overallGrade },
    ];
    if (report.rank > 0) {
      summaryItems.push({ label: 'CLASS RANK', value: `#${report.rank}` });
    }

    const summaryBoxW = (boxW - 8 * (summaryItems.length - 1)) / summaryItems.length;
    for (let i = 0; i < summaryItems.length; i++) {
      const bx = margin + i * (summaryBoxW + 8);
      doc.setFillColor(...white);
      doc.roundedRect(bx, y, summaryBoxW, 22, 3, 3, 'F');
      doc.setDrawColor(230);
      doc.setLineWidth(0.3);
      doc.roundedRect(bx, y, summaryBoxW, 22, 3, 3, 'S');

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accent);
      doc.text(summaryItems[i].label, bx + summaryBoxW / 2, y + 8, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...dark);
      doc.text(summaryItems[i].value, bx + summaryBoxW / 2, y + 17, { align: 'center' });
    }

    y += 30;

    // ── Subject Results Table ──
    if (report.results.length > 0) {
      doc.setFillColor(...accent);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 9, 2, 2, 'F');
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...white);
      doc.text('SUBJECT', margin + 6, y + 6);
      doc.text('OBTAINED', margin + 62, y + 6);
      doc.text('MAX', margin + 86, y + 6);
      doc.text('%', margin + 104, y + 6);
      doc.text('GRADE', margin + 122, y + 6);
      doc.text('EXAMS', pageWidth - margin - 6, y + 6, { align: 'right' });
      y += 11;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      for (let i = 0; i < report.results.length; i++) {
        const r = report.results[i];
        if (i % 2 === 0) {
          doc.setFillColor(250, 250, 252);
          doc.rect(margin, y, pageWidth - margin * 2, 10, 'F');
        }
        doc.setTextColor(...dark);
        doc.text(r.subjectName, margin + 6, y + 6);
        doc.text(r.marksObtained.toFixed(1), margin + 62, y + 6);
        doc.text(String(r.maxMarks), margin + 86, y + 6);
        doc.text(`${r.percentage.toFixed(1)}%`, margin + 104, y + 6);

        // Grade with color
        const gColor = gradeColors[r.letterGrade.charAt(0)] ?? gray;
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...gColor);
        doc.text(r.letterGrade, margin + 122, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...gray);
        doc.text(String(r.examCount), pageWidth - margin - 6, y + 6, { align: 'right' });
        y += 10;
      }

      // ── Bottom border ──
      y += 4;
      doc.setDrawColor(...accent);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      // ── Summary line ──
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...gray);
      doc.text(`Total: ${report.totalMarksObtained.toFixed(1)} / ${report.totalMaxMarks}`, margin, y);
      doc.text(`${report.overallPercentage.toFixed(1)}%`, margin + 70, y);
      doc.setTextColor(...accent);
      doc.text(report.overallGrade, margin + 100, y);
      if (report.rank > 0) {
        doc.setTextColor(...dark);
        doc.text(`Rank: #${report.rank}`, pageWidth - margin - 30, y);
      }
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...gray);
      doc.text('No results available for this term.', margin, y + 10);
    }

    // ── Footer ──
    doc.setDrawColor(220);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 24, pageWidth - margin, pageHeight - 24);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gray);
    doc.text('This report card was generated by skooLLy School Management System', pageWidth / 2, pageHeight - 17, { align: 'center' });
    doc.text(`School: ${schoolName} | ${school?.phoneNumber ?? ''} | ${school?.email ?? ''}`, pageWidth / 2, pageHeight - 12, { align: 'center' });
    doc.setFillColor(...accent);
    doc.rect(0, pageHeight - 4, pageWidth, 4, 'F');

    const fileName = `ReportCard_${report.admissionNumber}_${report.termName.replace(/\s+/g, '_')}.pdf`;
    doc.save(fileName);
  }
}
