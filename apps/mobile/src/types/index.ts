export type UserRole = 'worker' | 'clinic';

export type EmploymentType = 'permanent' | 'part-time' | 'temp' | 'fill-in';

export type WorkerProfile = {
  id: string;
  role: UserRole;
  displayName: string;
  licenseType?: string;
  yearsOfExperience?: number;
  travelRadiusKm?: number;
};

export type JobPost = {
  id: string;
  roleType: string;
  employmentType: EmploymentType;
  location: string;
  wageRange?: string;
  status: 'draft' | 'live' | 'filled' | 'closed';
};
