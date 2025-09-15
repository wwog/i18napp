import Database from "@tauri-apps/plugin-sql";

declare global {
  interface Window {
    sqlite: Database;
  }
}

export async function boot_db() {
  const db = await Database.load("sqlite:i18napp.db");
  window.sqlite = db;

  // 创建支持语言表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS supported_languages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 初始化默认支持的语言
  const defaultLanguages = [
    { name: "中文-简体", code: "zh-Hans" },
    { name: "中文-繁体", code: "zh-Hant" },
    { name: "英语", code: "en" },
    { name: "日语", code: "ja" },
    { name: "韩语", code: "ko" },
    { name: "土耳其语", code: "tr" }
  ];

  for (const lang of defaultLanguages) {
    await db.execute(
      `INSERT OR IGNORE INTO supported_languages (name, code) VALUES (?, ?)`,
      [lang.name, lang.code]
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      UNIQUE(project_id, key, language)
    )
  `);

  // 创建项目统计视图
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
      COUNT(t.id) as total_translations,
      COUNT(CASE WHEN t.is_completed = 1 THEN 1 END) as completed_translations
    FROM projects p
    LEFT JOIN translations t ON p.id = t.project_id
    GROUP BY p.id
  `);

  console.log("数据库初始化完成");
  return db;
}
