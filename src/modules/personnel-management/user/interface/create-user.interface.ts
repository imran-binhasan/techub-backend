import { BaseUserData } from "./base-user.interface";

export interface CreateUserData extends BaseUserData {
    roleId:number;
}