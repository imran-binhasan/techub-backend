import { BaseUserData } from "./base-user.interface";

export interface UpdateUserData extends Partial<BaseUserData> {
    image?: string;
}