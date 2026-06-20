export type ExamType = 'QUIZ' | 'ASSIGNMENT' | 'MIDTERM' | 'FINAL' | 'PRACTICAL' | 'PROJECT';

export interface ExamRequest {
  name: string;
  examType: ExamType;
  classroomId: number;
  subjectId: number;
  sessionId: number;
  termId: number;
  examDate: string;
  maxMarks: number;
  weightage?: number;
  description?: string;
}

export interface ExamResponse {
  id: number;
  name: string;
  examType: ExamType;
  classroomId: number;
  classroomName: string;
  classroomSection: string;
  subjectId: number;
  subjectName: string;
  sessionId: number;
  sessionName: string;
  termId: number;
  termName: string;
  examDate: string;
  maxMarks: number;
  weightage: number;
  description: string;
  published: boolean;
  totalGrades: number;
  createdAt: string;
}

export interface GradeRequest {
  examId: number;
  studentId: number;
  marksObtained: number;
  remark?: string;
}

export interface BulkGradeRequest {
  examId: number;
  records: { studentId: number; marksObtained: number; remark?: string }[];
}

export interface GradeResponse {
  id: number;
  examId: number;
  examName: string;
  examType: string;
  studentId: number;
  studentName: string;
  admissionNumber: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  letterGrade: string;
  remark: string;
  createdAt: string;
}

export interface GradeSheetResponse {
  examId: number;
  examName: string;
  examType: string;
  classroomId: number;
  classroomName: string;
  subjectId: number;
  subjectName: string;
  termId: number;
  termName: string;
  maxMarks: number;
  grades: GradeSheetEntry[];
  classAverage: number;
  highestMark: number;
  lowestMark: number;
}

export interface GradeSheetEntry {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  marksObtained: number;
  percentage: number;
  letterGrade: string;
  remark: string;
}

export interface ReportCardResponse {
  studentId: number;
  studentName: string;
  admissionNumber: string;
  classroomName: string;
  sessionName: string;
  termName: string;
  results: SubjectResult[];
  totalMarksObtained: number;
  totalMaxMarks: number;
  overallPercentage: number;
  overallGrade: string;
  rank: number;
}

export interface SubjectResult {
  subjectId: number;
  subjectName: string;
  marksObtained: number;
  maxMarks: number;
  percentage: number;
  letterGrade: string;
  examCount: number;
}

export interface GradingScaleResponse {
  id: number;
  gradeLetter: string;
  minPercentage: number;
  maxPercentage: number;
  description: string;
}

export const EXAM_TYPE_OPTIONS: { value: ExamType; label: string }[] = [
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'ASSIGNMENT', label: 'Assignment' },
  { value: 'MIDTERM', label: 'Midterm' },
  { value: 'FINAL', label: 'Final' },
  { value: 'PRACTICAL', label: 'Practical' },
  { value: 'PROJECT', label: 'Project' },
];
