import { reports, type InsertReport, type Report } from "@shared/schema";
import { db } from "./db";

export interface IStorage {
  createReport(report: InsertReport): Promise<Report>;
}

export class DatabaseStorage implements IStorage {
  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db
      .insert(reports)
      .values(insertReport)
      .returning();
    return report;
  }
}

export const storage = new DatabaseStorage();
