/**
 * User Entity
 * Represents users collection in Firestore for authentication
 */

import { BaseEntity, BaseDocument } from "./base.entity";
import { Timestamp } from "firebase-admin/firestore";

export type UserRole = "manager" | "employee" | "admin";

export interface UserDocument extends BaseDocument {
    phoneNumber?: string; // For managers
    email?: string; // For employees
    role: UserRole;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export class UserEntity extends BaseEntity<UserDocument> {
    constructor() {
        super("users");
    }

    async findByPhone(phoneNumber: string): Promise<UserDocument | null> {
        const snapshot = await this.collection.where("phoneNumber", "==", phoneNumber).limit(1).get();
        return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        const snapshot = await this.collection.where("email", "==", email).limit(1).get();
        return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    async findByRole(role: UserRole): Promise<UserDocument[]> {
        return this.query([["role", "==", role]]);
    }

    async createManager(phoneNumber: string, _name: string): Promise<string> {
        // Check if exists
        const existing = await this.findByPhone(phoneNumber);
        if (existing) return existing.id!;

        return this.create({
            phoneNumber,
            role: "manager",
        });
    }

    async createEmployee(email: string, _name: string): Promise<string> {
        // Check if exists
        const existing = await this.findByEmail(email);
        if (existing) return existing.id!;

        return this.create({
            email,
            role: "employee",
        });
    }
}

export const userEntity = new UserEntity();
