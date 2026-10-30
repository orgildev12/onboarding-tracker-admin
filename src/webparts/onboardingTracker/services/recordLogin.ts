import type { ListService } from './ListService';

// Login names already recorded since this page was loaded, so re-renders never write twice.
const recorded = new Set<string>();

// Keeps exactly one row per user in the Logins list: creates it on the first visit,
// afterwards only refreshes LastLoginDate. Failures are ignored on purpose, tracking must never break the app.
export async function recordLogin(loginsService: ListService, loginName: string): Promise<void> {
  if (!loginName || recorded.has(loginName)) {
    return;
  }
  recorded.add(loginName);
  try {
    const userId = await loginsService.ensureUser(loginName);
    const existing = await loginsService.getItems(1, `EmployeeId eq ${userId}`);
    const lastLoginDate = new Date().toISOString();
    if (existing.length > 0) {
      await loginsService.updateItem(Number(existing[0].Id), { LastLoginDate: lastLoginDate });
    } else {
      await loginsService.createItem({ EmployeeId: userId, LastLoginDate: lastLoginDate });
    }
  } catch {
    recorded.delete(loginName);
  }
}
