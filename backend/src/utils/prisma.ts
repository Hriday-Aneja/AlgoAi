import { randomUUID } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const storagePath = path.resolve(__dirname, "..", "..", "data", "dev-db.json");

interface DbState {
  users: any[];
  onboardingProfiles: any[];
  roadmaps: any[];
  userProgresses: any[];
  userProblemProgresses: any[];
  submissions: any[];
  hints: any[];
  visualizations: any[];
  streaks: any[];
}

const defaultState: DbState = {
  users: [],
  onboardingProfiles: [],
  roadmaps: [],
  userProgresses: [],
  userProblemProgresses: [],
  submissions: [],
  hints: [],
  visualizations: [],
  streaks: [],
};

const loadState = (): DbState => {
  try {
    if (!existsSync(storagePath)) {
      mkdirSync(path.dirname(storagePath), { recursive: true });
      writeFileSync(storagePath, JSON.stringify(defaultState, null, 2));
      return { ...defaultState };
    }

    const raw = readFileSync(storagePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      users: Array.isArray(parsed.users) ? parsed.users : [],
      onboardingProfiles: Array.isArray(parsed.onboardingProfiles) ? parsed.onboardingProfiles : [],
      roadmaps: Array.isArray(parsed.roadmaps) ? parsed.roadmaps : [],
      userProgresses: Array.isArray(parsed.userProgresses) ? parsed.userProgresses : [],
      userProblemProgresses: Array.isArray(parsed.userProblemProgresses) ? parsed.userProblemProgresses : [],
      submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
      hints: Array.isArray(parsed.hints) ? parsed.hints : [],
      visualizations: Array.isArray(parsed.visualizations) ? parsed.visualizations : [],
      streaks: Array.isArray(parsed.streaks) ? parsed.streaks : [],
    };
  } catch {
    return { ...defaultState };
  }
};

const saveState = (state: DbState) => {
  try {
    mkdirSync(path.dirname(storagePath), { recursive: true });
    writeFileSync(storagePath, JSON.stringify(state, null, 2));
  } catch {
    // ignore persistence failures
  }
};

const state = loadState();

const persist = () => saveState(state);

const applySelect = (record: any, select?: Record<string, boolean>) => {
  if (!select || !record) return record;
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(select)) {
    if (select[key]) filtered[key] = record[key];
  }
  return filtered;
};

const matchesWhere = (item: any, where?: any) => {
  if (!where) return true;
  return Object.entries(where).every(([key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date)) {
      return Object.entries(value as Record<string, unknown>).every(([nestedKey, nestedValue]) => item[key]?.[nestedKey] === nestedValue);
    }
    return item[key] === value;
  });
};

const createModel = <T extends Record<string, unknown>>(items: T[], idField = "id") => ({
  findUnique: async ({ where }: any) => {
    if (!where) return null;
    const entry = items.find((item) => matchesWhere(item, where));
    return entry ?? null;
  },
  create: async ({ data, select }: any) => {
    const row = { ...data, [idField]: data[idField] ?? randomUUID(), createdAt: data.createdAt ?? new Date().toISOString(), updatedAt: data.updatedAt ?? new Date().toISOString() };
    items.push(row as T);
    persist();
    return applySelect(row, select);
  },
  createMany: async ({ data }: any) => {
    const rows = (Array.isArray(data) ? data : [data]).map((row: any) => ({
      ...row,
      [idField]: row[idField] ?? randomUUID(),
      createdAt: row.createdAt ?? new Date().toISOString(),
      updatedAt: row.updatedAt ?? new Date().toISOString(),
    }));
    items.push(...rows as T[]);
    persist();
    return { count: rows.length };
  },
  upsert: async ({ where, create, update }: any) => {
    const existing = items.find((item) => matchesWhere(item, where));
    if (existing) {
      Object.assign(existing, { ...update, updatedAt: new Date().toISOString() });
      persist();
      return existing;
    }
    const row = { ...create, ...where, [idField]: create[idField] ?? randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    items.push(row as T);
    persist();
    return row;
  },
  update: async ({ where, data }: any) => {
    const entry = items.find((item) => matchesWhere(item, where));
    if (!entry) return null;
    Object.assign(entry, { ...data, updatedAt: new Date().toISOString() });
    persist();
    return entry;
  },
  deleteMany: async ({ where }: any = {}) => {
    const remaining = items.filter((item) => !matchesWhere(item, where));
    items.splice(0, items.length, ...remaining);
    persist();
    return { count: items.length };
  },
  findMany: async ({ where, orderBy }: any = {}) => {
    let filtered = items.filter((item) => matchesWhere(item, where));
    if (orderBy) {
      const [field, direction] = Object.entries(orderBy)[0];
      filtered = filtered.slice().sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        if (typeof av === "number" && typeof bv === "number") return direction === "desc" ? bv - av : av - bv;
        return String(av).localeCompare(String(bv));
      });
    }
    return filtered;
  },
  count: async ({ where }: any = {}) => {
    const filtered = items.filter((item) => matchesWhere(item, where));
    return filtered.length;
  },
  findFirst: async ({ where }: any = {}) => {
    const found = items.find((item) => matchesWhere(item, where));
    return found ?? null;
  },
});

const userModel = createModel<any>(state.users);
const onboardingProfileModel = createModel<any>(state.onboardingProfiles);
const roadmapModel = createModel<any>(state.roadmaps);
const userProgressModel = createModel<any>(state.userProgresses);
const userProblemProgressModel = createModel<any>(state.userProblemProgresses);
const submissionModel = createModel<any>(state.submissions);
const hintModel = createModel<any>(state.hints);
const visualizationModel = createModel<any>(state.visualizations);
const streakModel = createModel<any>(state.streaks);

class FallbackPrismaClient {
  public user = userModel;
  public onboardingProfile = onboardingProfileModel;
  public roadmap = roadmapModel;
  public userProgress = userProgressModel;
  public userProblemProgress = userProblemProgressModel;
  public submission = submissionModel;
  public hint = hintModel;
  public visualization = visualizationModel;
  public streak = streakModel;

  public $connect = async () => Promise.resolve();
  public $disconnect = async () => Promise.resolve();
  public $transaction = async (operations: any[]) => {
    const results: any[] = [];
    for (const operation of operations) {
      results.push(await operation);
    }
    return results;
  };
}

const prisma = new FallbackPrismaClient();

export default prisma;
