import { ApiResponse } from '../../students/models/student.models';

export type TeacherStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'RESIGNED'
  | 'TERMINATED';

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'VOLUNTEER';

export type QualificationLevel =
  | 'OND'
  | 'HND'
  | 'BSC'
  | 'PGDE'
  | 'MSC'
  | 'PHD'
  | 'OTHER';

// Request DTOs
export interface CreateTeacherRequest {
  firstName:             string;
  lastName:              string;
  email:                 string;
  password:              string;
  phoneNumber:           string;
  dateOfBirth:           string;
  gender:                string;
  address:               string;
  profilePictureUrl?:    string;
  joinDate:              string;
  employmentType:        EmploymentType;
  highestQualification?: QualificationLevel;
  specialization?:       string;
  yearsOfExperience?:    number;
  designation?:          string;
}

export interface UpdateTeacherRequest {
  highestQualification?: QualificationLevel;
  specialization?:       string;
  yearsOfExperience?:    number;
  employmentType?:       EmploymentType;
  designation?:          string;
}

// Response DTO
export interface TeacherResponse {
  id:                   number;
  userId:               number;
  firstName:            string;
  lastName:             string;
  email:                string;
  phoneNumber:          string;
  staffId:              string;
  joinDate:             string;
  highestQualification: QualificationLevel | null;
  specialization:       string | null;
  yearsOfExperience:    number | null;
  employmentType:       EmploymentType;
  designation:          string | null;
  status:               TeacherStatus;
  schoolName:           string;
  createdAt:            string;
}

export type { ApiResponse };
