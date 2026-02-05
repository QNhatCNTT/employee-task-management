/**
 * Message Entity
 * Represents messages collection in Firestore (Chat)
 */

import { BaseEntity, BaseDocument } from "./base.entity.js";
import { Timestamp } from "firebase-admin/firestore";

// Message delivery status type
export type MessageStatus = "sent" | "delivered" | "read";

export interface MessageDocument extends BaseDocument {
    chatId: string; // managerId_employeeId
    senderId: string;
    senderRole: "manager" | "employee";
    content: string;
    read: boolean; // Keep for backward compatibility
    status: MessageStatus;
    deliveredAt?: Timestamp;
    readAt?: Timestamp;
}

export class MessageEntity extends BaseEntity<MessageDocument> {
    constructor() {
        super("messages");
    }

    async findByChatId(chatId: string): Promise<MessageDocument[]> {
        const snapshot = await this.collection.where("chatId", "==", chatId).orderBy("createdAt", "asc").get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    async findByUser(userId: string): Promise<MessageDocument[]> {
        const snapshot = await this.collection
            .where("senderId", "==", userId)
            .orderBy("createdAt", "desc")
            .limit(100)
            .get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    async getUnreadCount(chatId: string): Promise<number> {
        const snapshot = await this.collection.where("chatId", "==", chatId).where("read", "==", false).count().get();
        return snapshot.data().count;
    }

    async createMessage(
        chatId: string,
        senderId: string,
        senderRole: "manager" | "employee",
        content: string,
    ): Promise<string> {
        return this.create({
            chatId,
            senderId,
            senderRole,
            content,
            read: false,
            status: "sent",
        });
    }

    async markAsRead(messageId: string): Promise<boolean> {
        return this.update(messageId, {
            read: true,
            status: "read",
            readAt: Timestamp.now(),
        });
    }

    async markAllAsRead(chatId: string, excludeSenderId?: string): Promise<{ count: number; messageIds: string[] }> {
        let query = this.collection.where("chatId", "==", chatId).where("read", "==", false);

        if (excludeSenderId) {
            query = query.where("senderId", "!=", excludeSenderId);
        }

        const snapshot = await query.get();
        const messageIds: string[] = [];
        const now = Timestamp.now();

        for (const doc of snapshot.docs) {
            await doc.ref.update({
                read: true,
                status: "read",
                readAt: now,
            });
            messageIds.push(doc.id);
        }

        return { count: messageIds.length, messageIds };
    }

    async updateStatus(messageId: string, status: MessageStatus): Promise<boolean> {
        const updates: Partial<MessageDocument> = { status };

        if (status === "delivered") {
            updates.deliveredAt = Timestamp.now();
        } else if (status === "read") {
            updates.read = true;
            updates.readAt = Timestamp.now();
        }

        return this.update(messageId, updates);
    }

    async markAsDelivered(messageIds: string[]): Promise<number> {
        const now = Timestamp.now();
        let count = 0;

        for (const id of messageIds) {
            const doc = await this.findById(id);
            if (doc && doc.status === "sent") {
                await this.update(id, {
                    status: "delivered",
                    deliveredAt: now,
                });
                count++;
            }
        }

        return count;
    }
}

export const messageEntity = new MessageEntity();
