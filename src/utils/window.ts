import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";

/**
 * 窗口管理工具类
 * 处理应用窗口的大小、状态管理
 */
export class WindowManager {
  /**
   * 项目开发页面的窗口配置
   */
  private static readonly PROJECT_DEV_CONFIG = {
    width: 1250,
    height: 750,
    resizable: true,
  };

  /**
   * 主页面的窗口配置
   */
  private static readonly MAIN_CONFIG = {
    width: 800,
    height: 650,
    resizable: false,
  };

  /**
   * 设置项目开发页面的窗口
   */
  static async setupProjectDevelopmentWindow(): Promise<void> {
    try {
      const appWindow = getCurrentWindow();

      // 设置窗口为可调整大小
      await appWindow.setResizable(this.PROJECT_DEV_CONFIG.resizable);

      // 设置窗口大小
      await appWindow.setSize(
        new LogicalSize(
          this.PROJECT_DEV_CONFIG.width,
          this.PROJECT_DEV_CONFIG.height
        )
      );
    } catch (error) {
      console.error("设置项目开发窗口失败:", error);
      throw new Error("设置窗口失败");
    }
  }

  /**
   * 重置到主页面的窗口
   */
  static async resetToMainWindow(): Promise<void> {
    try {
      const appWindow = getCurrentWindow();

      // 重置为不可调整大小
      await appWindow.setResizable(this.MAIN_CONFIG.resizable);

      // 重置窗口大小
      await appWindow.setSize(
        new LogicalSize(this.MAIN_CONFIG.width, this.MAIN_CONFIG.height)
      );
    } catch (error) {
      console.error("重置窗口状态失败:", error);
      throw new Error("重置窗口失败");
    }
  }

  /**
   * 安全地重置窗口（即使失败也不会阻止导航）
   */
  static async safeResetToMainWindow(): Promise<void> {
    try {
      await this.resetToMainWindow();
    } catch (error) {
      // 静默处理错误，不阻止导航
      console.warn("窗口重置失败，但不影响导航:", error);
    }
  }

  /**
   * 设置自定义窗口大小
   */
  static async setCustomWindowSize(
    width: number,
    height: number,
    resizable: boolean = true
  ): Promise<void> {
    try {
      const appWindow = getCurrentWindow();

      await appWindow.setResizable(resizable);
      await appWindow.setSize(new LogicalSize(width, height));
    } catch (error) {
      console.error("设置自定义窗口大小失败:", error);
      throw new Error("设置窗口大小失败");
    }
  }

  /**
   * 获取当前窗口信息
   */
  static async getCurrentWindowInfo(): Promise<{
    width: number;
    height: number;
    resizable: boolean;
  }> {
    try {
      const appWindow = getCurrentWindow();
      const physicalSize = await appWindow.innerSize();
      // 注意：getCurrentWindow() 可能没有直接获取 resizable 状态的方法
      // 这里我们返回一个默认值，实际使用时可能需要根据 Tauri API 调整
      return {
        width: physicalSize.width,
        height: physicalSize.height,
        resizable: true, // 可能需要根据实际 API 调整
      };
    } catch (error) {
      console.error("获取窗口信息失败:", error);
      throw new Error("获取窗口信息失败");
    }
  }
}

/**
 * 窗口生命周期管理器
 * 提供组件级别的窗口状态管理
 */
export class WindowLifecycleManager {
  private static cleanupCallbacks: (() => Promise<void>)[] = [];

  /**
   * 注册清理回调
   */
  static registerCleanup(callback: () => Promise<void>): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * 执行所有清理操作
   */
  static async cleanup(): Promise<void> {
    const results = await Promise.allSettled(
      this.cleanupCallbacks.map((callback) => callback())
    );

    // 记录失败的清理操作
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.warn(`清理操作 ${index} 失败:`, result.reason);
      }
    });

    // 清空回调列表
    this.cleanupCallbacks = [];
  }

  /**
   * 为项目开发页面设置生命周期
   */
  static setupProjectDevelopmentLifecycle(): {
    setup: () => Promise<void>;
    cleanup: () => Promise<void>;
  } {
    return {
      setup: async () => {
        await WindowManager.setupProjectDevelopmentWindow();

        // 注册清理回调，使用箭头函数保持正确的上下文
        this.registerCleanup(() => WindowManager.safeResetToMainWindow());
      },
      cleanup: async () => {
        console.log("项目开发页面卸载，执行清理");
        await this.cleanup();
      },
    };
  }
}
