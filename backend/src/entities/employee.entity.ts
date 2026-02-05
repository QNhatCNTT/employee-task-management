/**
 * Employee Entity
 * Represents employees collection in Firestore
 */

import { BaseEntity, BaseDocument } from "./base.entity";
import { Timestamp } from "firebase-admin/firestore";

export type EmployeeStatus = "active" | "inactive" | "suspended";
export type EmployeeRole = "employee" | "manager" | "admin";

export interface EmployeeDocument extends BaseDocument {
    name: string;
    phone?: string;
    email: string;
    role: EmployeeRole;
    description?: string;
    status: EmployeeStatus;
    managerId?: string; // Reference to manager's user ID
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export class EmployeeEntity extends BaseEntity<EmployeeDocument> {
    constructor() {
        super("employees");
    }

    async findByEmail(email: string): Promise<EmployeeDocument | null> {
        const snapshot = await this.collection.where("email", "==", email).limit(1).get();
        return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }

    async findByManager(managerId: string): Promise<EmployeeDocument[]> {
        return this.query([["managerId", "==", managerId]]);
    }

    async findByStatus(status: EmployeeStatus): Promise<EmployeeDocument[]> {
        return this.query([["status", "==", status]]);
    }

    async createEmployee(
        name: string,
        email: string,
        phone?: string,
        role: EmployeeRole = "employee",
        managerId?: string,
    ): Promise<string> {
        return this.create({
            name,
            email,
            phone,
            role,
            status: "active",
            managerId,
        });
    }

    async updateInfo(
        id: string,
        data: Partial<Pick<EmployeeDocument, "name" | "phone" | "description">>,
    ): Promise<boolean> {
        return this.update(id, data);
    }

    async updateStatus(id: string, status: EmployeeStatus): Promise<boolean> {
        return this.update(id, { status });
    }

    async updateRole(id: string, role: EmployeeRole): Promise<boolean> {
        return this.update(id, { role });
    }

    async assignManager(id: string, managerId: string): Promise<boolean> {
        return this.update(id, { managerId });
    }

    async deactivate(id: string): Promise<boolean> {
        return this.updateStatus(id, "inactive");
    }

    async suspend(id: string): Promise<boolean> {
        return this.updateStatus(id, "suspended");
    }

    async reactivate(id: string): Promise<boolean> {
        return this.updateStatus(id, "active");
    }
}

export const employeeEntity = new EmployeeEntity();
