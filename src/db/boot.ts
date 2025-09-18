import Database from "@tauri-apps/plugin-sql";

declare global {
  interface Window {
    sqlite: Database;
  }
}

export async function boot_db() {
  const db = await Database.load("sqlite:i18napp.db");
  window.sqlite = db;

  // 开发环境下清理数据库表
  if (import.meta.env.DEV) {
    console.log("开发环境：清理数据库表");
    // await db.execute(`DROP TABLE IF EXISTS supported_languages`);
    // await db.execute(`DROP TABLE IF EXISTS projects`);
    // await db.execute(`DROP TABLE IF EXISTS translations`);
    // await db.execute(`DROP VIEW IF EXISTS project_stats`);
  }

  // 创建支持语言表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS supported_languages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      icon TEXT,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 初始化默认支持的语言
  const defaultLanguages = [
    { name: "中文-简体", code: "zh-Hans", icon: "cn" },
    { name: "中文-繁体", code: "zh-Hant", icon: "tw" },
    { name: "英语", code: "en", icon: "us" },
    { name: "日语", code: "ja", icon: "jp" },
    { name: "韩语", code: "ko", icon: "kr" },
    { name: "土耳其语", code: "tr", icon: "tr" },
  ];

  for (const lang of defaultLanguages) {
    await db.execute(
      `INSERT OR IGNORE INTO supported_languages (name, code, icon) VALUES (?, ?, ?)`,
      [lang.name, lang.code, lang.icon]
    );
  }

  // 创建项目表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      selected_languages TEXT NOT NULL, -- JSON 数组形式存储项目选择的语言代码
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_completed BOOLEAN DEFAULT 0
    )
  `);

  // 创建翻译条目表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      language TEXT NOT NULL,
      value TEXT,
      is_completed BOOLEAN DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, key, language)
    )
  `);

  // 为现有数据添加 sort_order 字段（如果不存在）
  await db.execute(`
    ALTER TABLE translations ADD COLUMN sort_order INTEGER DEFAULT 0
  `).catch(() => {
    // 忽略字段已存在的错误
  });

  // 创建项目统计视图（简化版，主要用于向后兼容）
  await db.execute(`
    CREATE VIEW IF NOT EXISTS project_stats AS
    SELECT 
      p.id,
      p.name,
      p.description,
      p.selected_languages,
      p.created_at,
      p.updated_at,
      p.is_completed,
      0 as total_translations,
      0 as completed_translations
    FROM projects p
  `);

  console.log("数据库初始化完成");
  return db;
}
