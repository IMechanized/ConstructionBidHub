import { User, InsertUser, Rfp, InsertRfp, Bid, InsertBid, Employee, InsertEmployee } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Store } from "express-session";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;

  getRfps(): Promise<Rfp[]>;
  getRfpById(id: number): Promise<Rfp | undefined>;
  createRfp(rfp: InsertRfp & { organizationId: number }): Promise<Rfp>;
  updateRfp(id: number, rfp: Partial<Rfp>): Promise<Rfp>;
  deleteRfp(id: number): Promise<void>;

  getBids(rfpId: number): Promise<Bid[]>;
  createBid(bid: InsertBid & { rfpId: number; contractorId: number }): Promise<Bid>;
  deleteBid(id: number): Promise<void>;

  getEmployees(organizationId: number): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee & { organizationId: number }): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;

  sessionStore: Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rfps: Map<number, Rfp>;
  private bids: Map<number, Bid>;
  private employees: Map<number, Employee>;
  sessionStore: Store;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.rfps = new Map();
    this.bids = new Map();
    this.employees = new Map();
    this.currentId = { users: 1, rfps: 1, bids: 1, employees: 1 };
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = {
      id,
      ...insertUser,
      trade: null,
      yearlyRevenue: null,
      contact: null,
      telephone: null,
      cell: null,
      businessEmail: null,
      isMinorityOwned: false,
      minorityGroup: null,
      department: null,
      jurisdiction: null,
      onboardingComplete: false,
      status: "active",
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const existing = await this.getUser(id);
    if (!existing) {
      throw new Error("User not found");
    }
    const updated = { ...existing, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  async getRfps(): Promise<Rfp[]> {
    return Array.from(this.rfps.values());
  }

  async getRfpById(id: number): Promise<Rfp | undefined> {
    return this.rfps.get(id);
  }

  async createRfp(rfp: InsertRfp & { organizationId: number }): Promise<Rfp> {
    const id = this.currentId.rfps++;
    const newRfp: Rfp = { 
      ...rfp, 
      id, 
      status: "open",
      deadline: new Date(rfp.deadline),
      organizationId: rfp.organizationId 
    };
    this.rfps.set(id, newRfp);
    return newRfp;
  }

  async updateRfp(id: number, rfp: Partial<Rfp>): Promise<Rfp> {
    const existing = await this.getRfpById(id);
    if (!existing) throw new Error("RFP not found");
    const updated = { ...existing, ...rfp };
    this.rfps.set(id, updated);
    return updated;
  }

  async deleteRfp(id: number): Promise<void> {
    this.rfps.delete(id);
  }

  async getBids(rfpId: number): Promise<Bid[]> {
    return Array.from(this.bids.values()).filter(bid => bid.rfpId === rfpId);
  }

  async createBid(bid: InsertBid & { rfpId: number; contractorId: number }): Promise<Bid> {
    const id = this.currentId.bids++;
    const newBid: Bid = { ...bid, id };
    this.bids.set(id, newBid);
    return newBid;
  }

  async deleteBid(id: number): Promise<void> {
    this.bids.delete(id);
  }

  async getEmployees(organizationId: number): Promise<Employee[]> {
    return Array.from(this.employees.values()).filter(
      emp => emp.organizationId === organizationId
    );
  }

  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async createEmployee(employee: InsertEmployee & { organizationId: number }): Promise<Employee> {
    const id = this.currentId.employees++;
    const newEmployee: Employee = { ...employee, id, status: "pending" };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }

  async deleteEmployee(id: number): Promise<void> {
    this.employees.delete(id);
  }

  async deleteUser(id: number): Promise<void> {
    const bidsToDelete = Array.from(this.bids.entries())
      .filter(([_, bid]) => bid.contractorId === id)
      .map(([id]) => id);

    const employeesToDelete = Array.from(this.employees.entries())
      .filter(([_, emp]) => emp.organizationId === id)
      .map(([id]) => id);

    const rfpsToDelete = Array.from(this.rfps.entries())
      .filter(([_, rfp]) => rfp.organizationId === id)
      .map(([id]) => id);

    bidsToDelete.forEach(id => this.bids.delete(id));
    employeesToDelete.forEach(id => this.employees.delete(id));
    rfpsToDelete.forEach(id => this.rfps.delete(id));
    this.users.delete(id);
  }
}

export const storage = new MemStorage();