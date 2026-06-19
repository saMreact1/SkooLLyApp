export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'EXCUSED'
  | 'HALF_DAY';

export interface MarkAttendanceRequest {
  studentId: number;
  classroomId: number;
  sessionId: number;
  termId: number;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remark?: string;
}

export interface StudentAttendanceRecord {
  studentId: number;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  remark?: string;
}

export interface BulkMarkAttendanceRequest {
  classroomId: number;
  sessionId: number;
  termId: number;
  date: string;
  records: StudentAttendanceRecord[];
}

export interface AttendanceResponse {
  id: number;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  classroomId: number;
  classroomName: string;
  classroomSection: string;
  sessionId: number;
  sessionName: string;
  termId: number;
  termName: string;
  date: string;
  status: AttendanceStatus;
  checkInTime: string | null;
  checkOutTime: string | null;
  remark: string | null;
  markedByName: string;
  createdAt: string;
}

export interface AttendanceSummaryResponse {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  halfDayDays: number;
  percentage: number;
}

export const STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LATE', label: 'Late' },
  { value: 'EXCUSED', label: 'Excused' },
  { value: 'HALF_DAY', label: 'Half day' },
];
