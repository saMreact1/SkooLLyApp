// Request payloads
export interface CheckEmailSchoolRequest {
  email: string;
  schoolName: string;
}

export interface CheckEmailSchoolResponse {
  message: string;
  nextStep: 0 | 2 | 3;
  schoolExists: boolean;
  schoolId: number | null;
}

export interface CreateSchoolRequest {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  type: SchoolType;
  phoneNumber: string;
  logoUrl?: string;
}

export interface SchoolResponse {
  id: number;
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  phoneNumber: string;
  logoUrl?: string;
  type: SchoolType;
  status: SchoolStatus;
  schoolCode: string;
  schoolStatus: SchoolStatus;
  createdAt: string;
}

export interface CompleteRegistrationRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
  schoolId: number;
  gender: Gender;
  dateOfBirth: string;
  profilePictureUrl?: string;
  address: string;

  // Teacher-specific fields
  teacherEmploymentType?: EmploymentType;

  // Student fields
  admissionDate?: string;
  currentClass?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  bloodGroup?: string;
  medicalConditions?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: UserResponse;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  role: UserRole;
  enabled: boolean;
  profilePictureUrl: string | null;
  schoolId: number;
  schoolName: string;
}

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT';

export type SchoolType =
  | 'NURSERY'
  | 'PRIMARY'
  | 'SECONDARY'
  | 'NURSERY_AND_PRIMARY'
  | 'PRIMARY_SECONDARY'
  | 'NURSERY_AND_PRIMARY_AND_SECONDARY'
  | 'TERTIARY';

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'CONTRACT'
  | 'VOLUNTEER';

export type Gender =
  | 'MALE'
  | 'FEMALE';

export type SchoolStatus =
  | 'ACTICE'
  | 'PENDING'
  | 'SUSPENDED'

export interface RegistrationState {
  step: 1 | 2 | 3;
  email: string;
  schoolId: number | null;
  schoolExists: boolean;
  schoolName: string;
  serverMessage: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  schoolId: number;
  iat: number;
  exp: number;
}
