import {
  users,
  projects,
  tasks,
  taskComments,
  taskHistory,
  files,
  notifications,
  timeEntries,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Task,
  type InsertTask,
  type TaskWithDetails,
  type ProjectWithTasks,
  type UserWithStats,
  type TaskComment,
  type InsertTaskComment,
  type File,
  type InsertFile,
  type Notification,
  type InsertNotification,
  type TimeEntry,
  type InsertTimeEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, count, sum, sql } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<UserWithStats[]>;
  updateUserRole(userId: string, role: "admin" | "collaborator"): Promise<User>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProjects(): Promise<ProjectWithTasks[]>;
  getProjectById(id: number): Promise<ProjectWithTasks | undefined>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  getTasks(): Promise<TaskWithDetails[]>;
  getTaskById(id: number): Promise<TaskWithDetails | undefined>;
  getTasksByUserId(userId: string): Promise<TaskWithDetails[]>;
  getTasksByProjectId(projectId: number): Promise<TaskWithDetails[]>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;
  searchTasks(query: string): Promise<TaskWithDetails[]>;
  
  // Task comments
  addTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  getTaskComments(taskId: number): Promise<TaskComment[]>;
  
  // Task history
  addTaskHistory(taskId: number, userId: string, changes: string): Promise<void>;
  
  // File operations
  uploadFile(file: InsertFile): Promise<File>;
  getFiles(): Promise<File[]>;
  getFilesByTaskId(taskId: number): Promise<File[]>;
  getFilesByProjectId(projectId: number): Promise<File[]>;
  deleteFile(id: number): Promise<void>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  
  // Time tracking
  startTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  endTimeEntry(id: number, endTime: Date, duration: number): Promise<TimeEntry>;
  getActiveTimeEntry(userId: string): Promise<TimeEntry | undefined>;
  getUserTimeEntries(userId: string): Promise<TimeEntry[]>;
  
  // Analytics
  getDashboardStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    activeProjects: number;
    totalHours: number;
    efficiency: number;
  }>;
  
  getUserStats(userId: string): Promise<{
    taskCount: number;
    completedTaskCount: number;
    hoursWorked: number;
    efficiency: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<UserWithStats[]> {
    const usersWithStats = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        taskCount: count(tasks.id),
        completedTaskCount: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'concluida' THEN 1 END)`,
        hoursWorked: sql<number>`COALESCE(SUM(${timeEntries.duration}), 0) / 60.0`,
      })
      .from(users)
      .leftJoin(tasks, eq(tasks.assignedUserId, users.id))
      .leftJoin(timeEntries, eq(timeEntries.userId, users.id))
      .groupBy(users.id)
      .orderBy(users.firstName);

    return usersWithStats.map(user => ({
      ...user,
      efficiency: user.taskCount > 0 ? (user.completedTaskCount / user.taskCount) * 100 : 0,
    }));
  }

  async updateUserRole(userId: string, role: "admin" | "collaborator"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async getProjects(): Promise<ProjectWithTasks[]> {
    const projectList = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));

    const projectsWithTasks = await Promise.all(
      projectList.map(async (project) => {
        const projectTasks = await this.getTasksByProjectId(project.id);
        return {
          ...project,
          tasks: projectTasks,
        };
      })
    );

    return projectsWithTasks;
  }

  async getProjectById(id: number): Promise<ProjectWithTasks | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    if (!project) return undefined;

    const projectTasks = await this.getTasksByProjectId(id);
    const projectFiles = await this.getFilesByProjectId(id);

    return {
      ...project,
      tasks: projectTasks,
      files: projectFiles,
    };
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...project, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Task operations
  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    
    // Add history entry
    if (task.assignedUserId) {
      await this.addTaskHistory(newTask.id, task.assignedUserId, "Tarefa criada");
    }
    
    return newTask;
  }

  async getTasks(): Promise<TaskWithDetails[]> {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        projectId: tasks.projectId,
        assignedUserId: tasks.assignedUserId,
        createdUserId: tasks.createdUserId,
        startDate: tasks.startDate,
        dueDate: tasks.dueDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        project: projects,
        assignedUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assignedUserId, users.id))
      .orderBy(desc(tasks.createdAt));
  }

  async getTaskById(id: number): Promise<TaskWithDetails | undefined> {
    const [task] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        projectId: tasks.projectId,
        assignedUserId: tasks.assignedUserId,
        createdUserId: tasks.createdUserId,
        startDate: tasks.startDate,
        dueDate: tasks.dueDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        project: projects,
        assignedUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assignedUserId, users.id))
      .where(eq(tasks.id, id));

    if (!task) return undefined;

    const comments = await this.getTaskComments(id);
    const files = await this.getFilesByTaskId(id);
    const taskTimeEntries = await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.taskId, id));

    return {
      ...task,
      comments,
      files,
      timeEntries: taskTimeEntries,
    };
  }

  async getTasksByUserId(userId: string): Promise<TaskWithDetails[]> {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        projectId: tasks.projectId,
        assignedUserId: tasks.assignedUserId,
        createdUserId: tasks.createdUserId,
        startDate: tasks.startDate,
        dueDate: tasks.dueDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        project: projects,
        assignedUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assignedUserId, users.id))
      .where(eq(tasks.assignedUserId, userId))
      .orderBy(desc(tasks.createdAt));
  }

  async getTasksByProjectId(projectId: number): Promise<TaskWithDetails[]> {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        projectId: tasks.projectId,
        assignedUserId: tasks.assignedUserId,
        createdUserId: tasks.createdUserId,
        startDate: tasks.startDate,
        dueDate: tasks.dueDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        project: projects,
        assignedUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assignedUserId, users.id))
      .where(eq(tasks.projectId, projectId))
      .orderBy(desc(tasks.createdAt));
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task> {
    const [updatedTask] = await db
      .update(tasks)
      .set({ 
        ...task, 
        updatedAt: new Date(),
        completedAt: task.status === 'concluida' ? new Date() : undefined,
      })
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async searchTasks(query: string): Promise<TaskWithDetails[]> {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        status: tasks.status,
        priority: tasks.priority,
        projectId: tasks.projectId,
        assignedUserId: tasks.assignedUserId,
        createdUserId: tasks.createdUserId,
        startDate: tasks.startDate,
        dueDate: tasks.dueDate,
        estimatedHours: tasks.estimatedHours,
        actualHours: tasks.actualHours,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        project: projects,
        assignedUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assignedUserId, users.id))
      .where(
        or(
          like(tasks.title, `%${query}%`),
          like(tasks.description, `%${query}%`),
          like(projects.name, `%${query}%`)
        )
      )
      .orderBy(desc(tasks.createdAt));
  }

  // Task comments
  async addTaskComment(comment: InsertTaskComment): Promise<TaskComment> {
    const [newComment] = await db.insert(taskComments).values(comment).returning();
    return newComment;
  }

  async getTaskComments(taskId: number): Promise<TaskComment[]> {
    return await db
      .select()
      .from(taskComments)
      .where(eq(taskComments.taskId, taskId))
      .orderBy(taskComments.createdAt);
  }

  // Task history
  async addTaskHistory(taskId: number, userId: string, changes: string): Promise<void> {
    await db.insert(taskHistory).values({
      taskId,
      userId,
      changes,
    });
  }

  // File operations
  async uploadFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }

  async getFiles(): Promise<File[]> {
    return await db.select().from(files).orderBy(desc(files.createdAt));
  }

  async getFilesByTaskId(taskId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.taskId, taskId))
      .orderBy(desc(files.createdAt));
  }

  async getFilesByProjectId(projectId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.projectId, projectId))
      .orderBy(desc(files.createdAt));
  }

  async deleteFile(id: number): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Time tracking
  async startTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry> {
    const [newEntry] = await db.insert(timeEntries).values({
      ...entry,
      isActive: true,
    }).returning();
    return newEntry;
  }

  async endTimeEntry(id: number, endTime: Date, duration: number): Promise<TimeEntry> {
    const [updatedEntry] = await db
      .update(timeEntries)
      .set({
        endTime,
        duration,
        isActive: false,
      })
      .where(eq(timeEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async getActiveTimeEntry(userId: string): Promise<TimeEntry | undefined> {
    const [entry] = await db
      .select()
      .from(timeEntries)
      .where(and(eq(timeEntries.userId, userId), eq(timeEntries.isActive, true)));
    return entry;
  }

  async getUserTimeEntries(userId: string): Promise<TimeEntry[]> {
    return await db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.userId, userId))
      .orderBy(desc(timeEntries.createdAt));
  }

  // Analytics
  async getDashboardStats(): Promise<{
    totalTasks: number;
    completedTasks: number;
    activeProjects: number;
    totalHours: number;
    efficiency: number;
  }> {
    const [stats] = await db
      .select({
        totalTasks: count(tasks.id),
        completedTasks: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'concluida' THEN 1 END)`,
        activeProjects: sql<number>`COUNT(DISTINCT CASE WHEN ${projects.status} = 'active' THEN ${projects.id} END)`,
        totalHours: sql<number>`COALESCE(SUM(${timeEntries.duration}), 0) / 60.0`,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(timeEntries, eq(timeEntries.taskId, tasks.id));

    const efficiency = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

    return {
      ...stats,
      efficiency,
    };
  }

  async getUserStats(userId: string): Promise<{
    taskCount: number;
    completedTaskCount: number;
    hoursWorked: number;
    efficiency: number;
  }> {
    const [stats] = await db
      .select({
        taskCount: count(tasks.id),
        completedTaskCount: sql<number>`COUNT(CASE WHEN ${tasks.status} = 'concluida' THEN 1 END)`,
        hoursWorked: sql<number>`COALESCE(SUM(${timeEntries.duration}), 0) / 60.0`,
      })
      .from(tasks)
      .leftJoin(timeEntries, eq(timeEntries.taskId, tasks.id))
      .where(eq(tasks.assignedUserId, userId));

    const efficiency = stats.taskCount > 0 ? (stats.completedTaskCount / stats.taskCount) * 100 : 0;

    return {
      ...stats,
      efficiency,
    };
  }
}

export const storage = new DatabaseStorage();
