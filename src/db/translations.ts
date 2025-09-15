// 翻译数据类型定义
export interface Translation {
  id: number;
  project_id: number;
  key: string;
  language: string;
  value: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

// 用于创建新翻译的数据接口
export interface CreateTranslationData {
  project_id: number;
  key: string;
  language: string;
  value: string;
  is_completed?: boolean;
}

// 用于批量创建翻译的数据接口
export interface BulkCreateTranslationData {
  project_id: number;
  key: string;
  translations: {
    language: string;
    value: string;
    is_completed?: boolean;
  }[];
}

// 翻译分组接口，用于在UI中展示
export interface TranslationGroup {
  key: string;
  sort_order: number;
  translations: {
    language: string;
    value: string;
    is_completed: boolean;
  }[];
}

// 排序选项枚举
export enum SortOption {
  TIME_DESC = 'time_desc',  // 按时间降序（新增在前）
  TIME_ASC = 'time_asc',    // 按时间升序
  KEY_ASC = 'key_asc',      // 按键名升序
  KEY_DESC = 'key_desc',    // 按键名降序
}

// 排序配置接口
export interface SortConfig {
  sortBy: SortOption;
}

// 翻译数据库操作类
export class TranslationService {
  private get db() {
    if (!window.sqlite) {
      throw new Error("数据库未初始化，请先调用 boot_db()");
    }
    return window.sqlite;
  }

  // 添加单条翻译
  async createTranslation(data: CreateTranslationData): Promise<number> {
    // 获取当前最大的 sort_order 值
    const maxSortResult = await this.db.select<any[]>(
      `SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM translations WHERE project_id = ?`,
      [data.project_id]
    );
    const nextSortOrder = (maxSortResult[0]?.max_sort || 0) + 1;

    const result = await this.db.execute(
      `INSERT INTO translations (project_id, key, language, value, is_completed, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.project_id,
        data.key,
        data.language,
        data.value,
        data.is_completed === undefined ? false : data.is_completed,
        nextSortOrder,
      ]
    );
    
    if (result.lastInsertId === undefined) {
      throw new Error("添加翻译失败");
    }
    
    return result.lastInsertId;
  }

  // 批量添加翻译（同一个key的多种语言翻译）
  async bulkCreateTranslations(data: BulkCreateTranslationData): Promise<void> {
    try {
      // 使用单个 SQL 语句批量插入，避免事务问题
      if (data.translations.length === 0) return;
      
      // 获取当前最大的 sort_order 值
      const maxSortResult = await this.db.select<any[]>(
        `SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM translations WHERE project_id = ?`,
        [data.project_id]
      );
      const nextSortOrder = (maxSortResult[0]?.max_sort || 0) + 1;
      
      // 构建批量插入的 SQL 语句
      const values = data.translations.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      const sql = `INSERT INTO translations (project_id, key, language, value, is_completed, sort_order) VALUES ${values}`;
      
      // 构建参数数组
      const params: any[] = [];
      for (const translation of data.translations) {
        params.push(
          data.project_id,
          data.key,
          translation.language,
          translation.value,
          translation.is_completed === undefined ? false : translation.is_completed,
          nextSortOrder
        );
      }
      
      await this.db.execute(sql, params);
    } catch (error) {
      console.error("批量创建翻译失败:", error);
      throw error;
    }
  }

  // 更新翻译内容
  async updateTranslation(
    project_id: number,
    key: string,
    language: string,
    value: string,
    is_completed?: boolean
  ): Promise<void> {
    const updateParams = [];
    let updateQuery = 'UPDATE translations SET value = ?, updated_at = CURRENT_TIMESTAMP';
    updateParams.push(value);
    
    if (is_completed !== undefined) {
      updateQuery += ', is_completed = ?';
      updateParams.push(is_completed);
    }
    
    updateQuery += ' WHERE project_id = ? AND key = ? AND language = ?';
    updateParams.push(project_id, key, language);
    
    await this.db.execute(updateQuery, updateParams);
  }

  // 更新翻译完成状态
  async updateTranslationStatus(
    project_id: number,
    key: string,
    language: string,
    is_completed: boolean
  ): Promise<void> {
    await this.db.execute(
      `UPDATE translations 
       SET is_completed = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE project_id = ? AND key = ? AND language = ?`,
      [is_completed, project_id, key, language]
    );
  }

  // 删除特定key的所有语言翻译
  async deleteTranslationKey(project_id: number, key: string): Promise<void> {
    await this.db.execute(
      'DELETE FROM translations WHERE project_id = ? AND key = ?',
      [project_id, key]
    );
  }

  // 获取项目所有翻译，按key分组，支持排序
  async getProjectTranslations(project_id: number, sortConfig: SortConfig = { sortBy: SortOption.TIME_DESC }): Promise<TranslationGroup[]> {
    // 根据排序选项构建ORDER BY子句
    let orderBy = '';
    switch (sortConfig.sortBy) {
      case SortOption.TIME_DESC:
        orderBy = 'ORDER BY sort_order DESC, key';
        break;
      case SortOption.TIME_ASC:
        orderBy = 'ORDER BY sort_order ASC, key';
        break;
      case SortOption.KEY_ASC:
        orderBy = 'ORDER BY key ASC';
        break;
      case SortOption.KEY_DESC:
        orderBy = 'ORDER BY key DESC';
        break;
      default:
        orderBy = 'ORDER BY sort_order DESC, key';
    }

    const result = await this.db.select<any[]>(
      `SELECT key, language, value, is_completed, sort_order
       FROM translations 
       WHERE project_id = ? 
       ${orderBy}, language`,
      [project_id]
    );

    // 将数据按key分组
    const translationMap = new Map<string, TranslationGroup>();
    
    for (const row of result) {
      if (!translationMap.has(row.key)) {
        translationMap.set(row.key, {
          key: row.key,
          sort_order: row.sort_order || 0,
          translations: [],
        });
      }
      
      const group = translationMap.get(row.key)!;
      group.translations.push({
        language: row.language,
        value: row.value,
        is_completed: !!row.is_completed,
      });
    }
    
    return Array.from(translationMap.values());
  }

  // 获取特定key的所有翻译
  async getTranslationsByKey(project_id: number, key: string): Promise<{language: string, value: string, is_completed: boolean}[]> {
    const result = await this.db.select<any[]>(
      `SELECT language, value, is_completed 
       FROM translations 
       WHERE project_id = ? AND key = ? 
       ORDER BY language`,
      [project_id, key]
    );
    
    return result.map(row => ({
      language: row.language,
      value: row.value,
      is_completed: !!row.is_completed,
    }));
  }

  // 搜索翻译，支持排序
  async searchTranslations(project_id: number, searchTerm: string, sortConfig: SortConfig = { sortBy: SortOption.TIME_DESC }): Promise<TranslationGroup[]> {
    // 根据排序选项构建ORDER BY子句
    let orderBy = '';
    switch (sortConfig.sortBy) {
      case SortOption.TIME_DESC:
        orderBy = 'ORDER BY sort_order DESC, key';
        break;
      case SortOption.TIME_ASC:
        orderBy = 'ORDER BY sort_order ASC, key';
        break;
      case SortOption.KEY_ASC:
        orderBy = 'ORDER BY key ASC';
        break;
      case SortOption.KEY_DESC:
        orderBy = 'ORDER BY key DESC';
        break;
      default:
        orderBy = 'ORDER BY sort_order DESC, key';
    }

    const result = await this.db.select<any[]>(
      `SELECT key, language, value, is_completed, sort_order
       FROM translations 
       WHERE project_id = ? AND (key LIKE ? OR value LIKE ?) 
       ${orderBy}, language`,
      [project_id, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    
    // 将数据按key分组
    const translationMap = new Map<string, TranslationGroup>();
    
    for (const row of result) {
      if (!translationMap.has(row.key)) {
        translationMap.set(row.key, {
          key: row.key,
          sort_order: row.sort_order || 0,
          translations: [],
        });
      }
      
      const group = translationMap.get(row.key)!;
      group.translations.push({
        language: row.language,
        value: row.value,
        is_completed: !!row.is_completed,
      });
    }
    
    return Array.from(translationMap.values());
  }

  // 导出项目翻译数据（格式化为前端可用的格式）
  async exportProjectTranslations(project_id: number): Promise<{ [key: string]: { [language: string]: string } }> {
    const groups = await this.getProjectTranslations(project_id);
    
    const exportData: { [key: string]: { [language: string]: string } } = {};
    
    for (const group of groups) {
      exportData[group.key] = {};
      
      for (const translation of group.translations) {
        exportData[group.key][translation.language] = translation.value;
      }
    }
    
    return exportData;
  }

  // 导入翻译数据
  async importTranslations(project_id: number, data: { [key: string]: { [language: string]: string } }): Promise<void> {
    // 不使用显式事务，依赖数据库的自动事务处理
    try {
      for (const key of Object.keys(data)) {
        const translations = data[key];
        
        for (const language of Object.keys(translations)) {
          const value = translations[language];
          
          // 尝试更新现有翻译，如果不存在则插入新翻译
          const existingResult = await this.db.select<any[]>(
            'SELECT id FROM translations WHERE project_id = ? AND key = ? AND language = ?',
            [project_id, key, language]
          );
          
          if (existingResult.length > 0) {
            // 更新现有翻译
            await this.updateTranslation(project_id, key, language, value, value.trim() !== '');
          } else {
            // 插入新翻译
            await this.createTranslation({
              project_id,
              key,
              language,
              value,
              is_completed: value.trim() !== '',
            });
          }
        }
      }
    } catch (error) {
      console.error("导入翻译失败:", error);
      throw error;
    }
  }

  // 获取项目中所有翻译键
  async getProjectKeys(project_id: number): Promise<string[]> {
    const result = await this.db.select<any[]>(
      `SELECT DISTINCT key 
       FROM translations 
       WHERE project_id = ? 
       ORDER BY key`,
      [project_id]
    );
    
    return result.map(row => row.key);
  }

  // 检查翻译键是否存在
  async isKeyExists(project_id: number, key: string): Promise<boolean> {
    const result = await this.db.select<any[]>(
      'SELECT COUNT(*) as count FROM translations WHERE project_id = ? AND key = ?',
      [project_id, key]
    );
    
    return result[0].count > 0;
  }

  // 获取项目翻译进度统计
  async getTranslationProgress(project_id: number): Promise<{
    overall: number;
    byLanguage: { [language: string]: number };
    totalKeys: number;
  }> {
    // 获取项目中使用的所有语言
    const languagesResult = await this.db.select<any[]>(
      `SELECT DISTINCT language 
       FROM translations 
       WHERE project_id = ?`,
      [project_id]
    );
    
    const languages = languagesResult.map(row => row.language);
    
    // 获取项目总键数
    const keysResult = await this.db.select<any[]>(
      `SELECT COUNT(DISTINCT key) as total 
       FROM translations 
       WHERE project_id = ?`,
      [project_id]
    );
    
    const totalKeys = keysResult[0].total;
    
    if (totalKeys === 0) {
      return {
        overall: 0,
        byLanguage: {},
        totalKeys: 0,
      };
    }
    
    // 获取各语言完成情况
    const progressByLanguage: { [language: string]: number } = {};
    
    for (const language of languages) {
      const completedResult = await this.db.select<any[]>(
        `SELECT COUNT(*) as completed 
         FROM translations 
         WHERE project_id = ? AND language = ? AND is_completed = 1`,
        [project_id, language]
      );
      
      const completed = completedResult[0].completed;
      progressByLanguage[language] = Math.round((completed / totalKeys) * 100);
    }
    
    // 计算整体进度
    const completedKeysResult = await this.db.select<any[]>(
      `SELECT COUNT(*) as count 
       FROM (
         SELECT key 
         FROM translations 
         WHERE project_id = ? 
         GROUP BY key 
         HAVING COUNT(*) = ? AND SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) = ?
       )`,
      [project_id, languages.length, languages.length]
    );
    
    const completedKeys = completedKeysResult[0].count;
    const overallProgress = Math.round((completedKeys / totalKeys) * 100);
    
    return {
      overall: overallProgress,
      byLanguage: progressByLanguage,
      totalKeys,
    };
  }
}

// 创建全局翻译服务实例
export const translationService = new TranslationService();