import {Gender} from '../../../core/auth/models/auth.model';

export type StudentStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'GRADUATED'
  | 'TRANSFERRED'
  | 'EXPELLED';

export type BloodGroup =
  | 'A_POSITIVE'  | 'A_NEGATIVE'
  | 'B_POSITIVE'  | 'B_NEGATIVE'
  | 'AB_POSITIVE' | 'AB_NEGATIVE'
  | 'O_POSITIVE'  | 'O_NEGATIVE';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface CreateStudentRequest {
  firstName:                    string;
  lastName:                     string;
  email:                        string;
  password:                     string;
  phoneNumber:                  string;
  dateOfBirth:                  string;
  gender:                       Gender;
  address:                      string;
  profilePictureUrl?:           string;
  admissionDate:                string;
  currentClass:                 string;
  emergencyContactName?:         string;
  emergencyContactPhone?:        string;
  emergencyContactRelationship?: string;
  bloodGroup?:                   string;
  medicalConditions?:            string;
}

export interface UpdateStudentRequest {
  currentClass?:                 string;
  emergencyContactName?:         string;
  emergencyContactPhone?:        string;
  emergencyContactRelationship?: string;
  bloodGroup?:                   string;
  medicalConditions?:            string;
}

export interface StudentResponse {
  id:                            number;
  userId:                        number;
  firstName:                     string;
  lastName:                      string;
  email:                         string;
  admissionNumber:               string;
  admissionDate:                 string;
  currentClass:                 string;
  status:                       StudentStatus;
  bloodGroup:                    string | null;
  emergencyContactName:          string | null;
  emergencyContactPhone:         string | null;
  emergencyContactRelationship:  string | null;
  schoolName:                    string;
  profilePictureUrl:             string | null;
  createdAt:                     string;
}
