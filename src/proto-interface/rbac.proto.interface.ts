import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";

export interface UpdateGrantForRoleRequest {
  role: string;
  resource: string;
  actions: string[];
}

export interface UpdateGrantForRoleResponse {
  role: string;
  resource: string;
  actions: string[];
}

export interface DeleteGrantForRoleRequest {
  role: string;
  resource: string;
  actions: string[];
}

export interface DeleteGrantForRoleResponse {
  role: string;
  resource: string;
  actions: string[];
}

export interface CreateRolesRequest {
  role: string;
  description: string;
}

export interface CreateRolesResponse {
  role: string;
  description: string;
}

export interface CreateResourcesRequest {
  resource: string;
  description: string;
}

export interface CreateResourcesResponse {
  resource: string;
  description: string;
}

export interface GrantAccessToRoleRequest {
  role: string;
  resource: string;
  actions: string[];
}

export interface GrantAccessToRoleResponse {
  role: string;
  resource: string;
  actions: string[];
}

export interface PermissionRequest {
  userId: string;
  resource: string;
  action: string;
}

export interface PermissionResponse {
  allowed: boolean;
}

export interface UserPermissionsRequest {
  userId: string;
}

export interface UserPermissionsResponse {
  permissions: Role[];
}

export interface Role {
  resource: string;
  actions: string[];
}

export interface RoleCheckRequest {
  userId: string;
  roleName: string;
}

export interface RoleCheckResponse {
  hasRole: boolean;
}


export interface RBACServiceClient {
  checkPermission(request: PermissionRequest, metaData: Metadata): Observable<PermissionResponse>;

  getUserPermissions(request: UserPermissionsRequest, metaData: Metadata): Observable<UserPermissionsResponse>;

  hasRole(request: RoleCheckRequest, metaData: Metadata): Observable<RoleCheckResponse>;

  createRole(request: CreateRolesRequest, metaData: Metadata): Observable<CreateRolesResponse>;

  createResource(request: CreateResourcesRequest, metaData: Metadata): Observable<CreateResourcesResponse>;

  grantAccessToRole(request: GrantAccessToRoleRequest, metaData: Metadata): Observable<GrantAccessToRoleResponse>;

  updateGrantForRole(request: UpdateGrantForRoleRequest, metaData: Metadata): Observable<UpdateGrantForRoleResponse>;

  deleteGrantForRole(request: DeleteGrantForRoleRequest, metaData: Metadata): Observable<DeleteGrantForRoleResponse>;
}
