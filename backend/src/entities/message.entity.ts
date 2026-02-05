/**
 * Message Entity
 * Represents messages collection in Firestore (Chat)
 */

import { BaseEntity, BaseDocument } from "./base.entity.js";

export interface MessageDocument extends BaseDocument {
    chatId: string; // managerId_employeeId
    senderId: string;
    senderRole: "manager" | "employee";
    content: string;
    read: boolean;
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
        // Find messages where user is sender or part of chat
        // This is a simplified version - in production you'd want to query by chat memberships
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
        });
    }

    async markAsRead(messageId: string): Promise<boolean> {
        return this.update(messageId, { read: true });
    }

    async markAllAsRead(chatId: string): Promise<number> {
        const snapshot = await this.collection.where("chatId", "==", chatId).where("read", "==", false).get();

        let count = 0;
        for (const doc of snapshot.docs) {
            await doc.ref.update({ read: true });
            count++;
        }

        return count;
    }
}

export const messageEntity = new MessageEntity();
