// Enums — match Java enums exactly
export type SessionStatus = 'ACTIVE' | 'INACTIVE' | 'COMPLETED';

export type TermStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED';

export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Session
export interface CreateSessionRequest {
  name:      string;
  startDate: string;   // "YYYY-MM-DD"
  endDate:   string;
}

export interface SessionResponse {
  id:         number;
  name:       string;
  startDate:  string;
  endDate:    string;
  status:     SessionStatus;
  isCurrent:  boolean;
  needsDateUpdate: boolean;
  schoolName: string;
  terms:      TermResponse[];
  createdAt:        string;
}

// Enrollment
export type EnrollmentStatus = 'ENROLLED' | 'DROPPED' | 'COMPLETED';

export interface EnrollStudentRequest {
  studentId:  number;
  subjectIds: number[];
  termId:     number;
}

export interface StudentSubjectResponse {
  id:               number;
  studentId:        number;
  studentName:      string;
  admissionNumber:  string;
  subjectId:        number;
  subjectName:      string;
  subjectCode:      string;
  termId:           number;
  termName:         string;
  status:           EnrollmentStatus;
  enrolledAt:       string;
}

export interface EnrolledStudentResponse {
  id:               number;
  studentId:        number;
  studentName:      string;
  admissionNumber:  string;
  status:           EnrollmentStatus;
  enrolledAt:       string;
}

// Term
export interface CreateTermRequest {
  sessionId: number;
  name:      string;   // e.g. "First Term", "Second Term"
  startDate: string;
  endDate:   string;
}

export interface UpdateTermRequest {
  name:      string;
  startDate: string;
  endDate:   string;
}

export interface TermResponse {
  id:          number;
  sessionId:   number;
  sessionName: string;
  name:        string;
  startDate:   string;
  endDate:     string;
  status:      TermStatus;
  isCurrent:   boolean;
  needsDateUpdate: boolean;
  createdAt:   string;
}

// Subject
export interface CreateSubjectRequest {
  name:        string;
  code:        string;
  description?: string;
  category?:   string;
  isElective:  boolean;
}

export interface UpdateSubjectRequest {
  name?:        string;
  code?:        string;
  description?: string;
  category?:    string;
  isElective?:  boolean;
  active?:      boolean;
}

export interface SubjectResponse {
  id:          number;
  name:        string;
  code:        string;
  description: string | null;
  category:    string | null;
  isElective:  boolean;
  isDefault:   boolean;
  active:      boolean;
  schoolName:  string;
  createdAt:   string;
}

// Classroom
export interface CreateClassroomRequest {
  name:            string;
  section:         string;
  description?:    string;
  capacity?:       number;
  classTeacherId?: number;
  level?:          string;
}

export interface UpdateClassroomRequest {
  name?:           string;
  section?:        string;
  description?:    string;
  capacity?:       number;
  classTeacherId?: number;
  level?:          string;
  active?:         boolean;
}

export interface ClassroomResponse {
  id:               number;
  name:             string;
  section:          string;
  description:      string | null;
  capacity:         number | null;
  classTeacherId:   number | null;
  classTeacherName: string | null;
  level:            string | null;
  active:           boolean;
  schoolName:       string;
  createdAt:        string;
}

// Timetable
export interface CreateTimetableRequest {
  sessionId:  number;
  termId:     number;
  classroomId: number;
  subjectId:  number;
  teacherId:  number;
  dayOfWeek:  DayOfWeek;
  startTime:  string;
  endTime:    string;
}

export interface TimetableResponse {
  id:               number;
  sessionId:        number;
  sessionName:      string;
  termId:           number;
  termName:         string;
  classroomId:      number;
  classroomName:    string;
  classroomSection: string;
  subjectId:        number;
  subjectName:      string;
  teacherId:        number;
  teacherName:      string;
  dayOfWeek:        DayOfWeek;
  startTime:        string;
  endTime:          string;
  createdAt:        string;
}
