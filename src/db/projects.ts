// 项目数据类型定义
export interface Project {
  id: number;
  name: string;
  description?: string;
  selected_languages: string[]; // 语言代码数组
  language_names?: string[]; // 语言名称数组（用于显示）
  created_at: string;
  updated_at: string;
  is_completed: boolean;
  total_translations?: number;
  completed_translations?: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  selected_languages: string[]; // 语言代码数组
}

// 项目数据库操作类
export class ProjectService {
  private get db() {
    if (!window.sqlite) {
      throw new Error("数据库未初始化，请先调用 boot_db()");
    }
    return window.sqlite;
  }

  // 创建新项目
  async createProject(data: CreateProjectData): Promise<number> {
    const result = await this.db.execute(
      `INSERT INTO projects (name, description, selected_languages) 
       VALUES (?, ?, ?)`,
      [data.name, data.description || '', JSON.stringify(data.selected_languages)]
    );
    
    if (result.lastInsertId === undefined) {
      throw new Error("创建项目失败");
    }
    
    return result.lastInsertId;
  }

  // 获取所有项目（带统计信息）
  async getAllProjects(): Promise<Project[]> {
    const result = await this.db.select<any[]>(
      `SELECT 
         id, name, description, selected_languages, created_at, updated_at, is_completed,
         total_translations, completed_translations
       FROM project_stats 
       ORDER BY updated_at DESC`
    );

    return result.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      selected_languages: JSON.parse(row.selected_languages || '[]'),
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_completed: !!row.is_completed,
      total_translations: row.total_translations || 0,
      completed_translations: row.completed_translations || 0,
    }));
  }

  // 根据ID获取项目
  async getProjectById(id: number): Promise<Project | null> {
    const result = await this.db.select<any[]>(
      `SELECT 
         id, name, description, selected_languages, created_at, updated_at, is_completed,
         total_translations, completed_translations
       FROM project_stats 
       WHERE id = ?`,
      [id]
    );

    if (result.length === 0) return null;

    const row = result[0];
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      selected_languages: JSON.parse(row.selected_languages || '[]'),
      created_at: row.created_at,
      updated_at: row.updated_at,
      is_completed: !!row.is_completed,
      total_translations: row.total_translations || 0,
      completed_translations: row.completed_translations || 0,
    };
  }

  // 更新项目
  async updateProject(id: number, data: Partial<CreateProjectData>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.selected_languages !== undefined) {
      updates.push('selected_languages = ?');
      params.push(JSON.stringify(data.selected_languages));
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      await this.db.execute(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }
  }

  // 删除项目
  async deleteProject(id: number): Promise<void> {
    await this.db.execute('DELETE FROM projects WHERE id = ?', [id]);
  }

  // 标记项目为完成/未完成
  async toggleProjectCompletion(id: number): Promise<void> {
    await this.db.execute(
      `UPDATE projects 
       SET is_completed = NOT is_completed, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [id]
    );
  }
}

// 创建全局项目服务实例
export const projectService = new ProjectService();