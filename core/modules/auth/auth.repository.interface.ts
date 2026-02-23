export interface ISessionRepository {
    create(session: any): void;
    findByToken(token: string): any;
    updateExpiration(token: string, newExpiresAt: number): void;
    deleteByToken(token: string): void;
    deleteExpired(now: number): void;
    deleteAll(): void;
    deleteByUserId(userId: number): void;
}
