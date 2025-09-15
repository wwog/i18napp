// 语言数据类型定义
export interface SupportedLanguage {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateLanguageData {
  name: string;
  code: string;
}

// 语言数据库操作类
export class LanguageService {
  private get db() {
    if (!window.sqlite) {
      throw new Error("数据库未初始化，请先调用 boot_db()");
    }
    return window.sqlite;
  }

  // 获取所有活跃的支持语言
  async getAllActiveLanguages(): Promise<SupportedLanguage[]> {
    const result = await this.db.select<any[]>(
      `SELECT id, name, code, is_active, created_at 
       FROM supported_languages 
       WHERE is_active = 1 
       ORDER BY name`
    );

    return result.map(row => ({
      id: row.id,
      name: row.name,
      code: row.code,
      is_active: !!row.is_active,
      created_at: row.created_at,
    }));
  }

  // 获取所有语言（包括非活跃的）
  async getAllLanguages(): Promise<SupportedLanguage[]> {
    const result = await this.db.select<any[]>(
      `SELECT id, name, code, is_active, created_at 
       FROM supported_languages 
       ORDER BY name`
    );

    return result.map(row => ({
      id: row.id,
      name: row.name,
      code: row.code,
      is_active: !!row.is_active,
      created_at: row.created_at,
    }));
  }

  // 添加新语言
  async addLanguage(data: CreateLanguageData): Promise<number> {
    const result = await this.db.execute(
      `INSERT INTO supported_languages (name, code) VALUES (?, ?)`,
      [data.name, data.code]
    );
    
    if (result.lastInsertId === undefined) {
      throw new Error("添加语言失败");
    }
    
    return result.lastInsertId;
  }

  // 切换语言活跃状态
  async toggleLanguageStatus(id: number): Promise<void> {
    await this.db.execute(
      `UPDATE supported_languages 
       SET is_active = NOT is_active 
       WHERE id = ?`,
      [id]
    );
  }

  // 根据代码获取语言名称列表
  async getLanguageNamesByCodes(codes: string[]): Promise<string[]> {
    if (codes.length === 0) return [];
    
    const placeholders = codes.map(() => '?').join(',');
    const result = await this.db.select<any[]>(
      `SELECT name FROM supported_languages 
       WHERE code IN (${placeholders}) AND is_active = 1
       ORDER BY name`,
      codes
    );

    return result.map(row => row.name);
  }
}

// 创建全局语言服务实例
export const languageService = new LanguageService();