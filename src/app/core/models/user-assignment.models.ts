export interface UserAssignment {
  id?: number;
  userId: number;
  companyId: number;
  roleId: number;
  companyName: string;
  roleName: string;
  defaultCompany?: boolean;
  active: boolean;
}


export interface CreateAssignmentRequest {
  userId: number;
  companyId: number;
  roleId: number;
}
