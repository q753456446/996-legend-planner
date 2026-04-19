import { runMigrations } from '@/lib/db/migrate';

// 确保数据库已初始化
let initialized = false;

export function ensureDbInitialized() {
  if (!initialized) {
    runMigrations();
    initialized = true;
  }
}
