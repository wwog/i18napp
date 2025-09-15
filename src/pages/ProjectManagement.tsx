import { DocumentRegular, FolderOpenRegular } from "@fluentui/react-icons";
import { useStyles } from "./styles";
import { Project } from "../db/projects";
import { CreateProjectDialog } from "../components/CreateProjectDialog";
import { OpenProjectDialog } from "../components/OpenProjectDialog";

export default function ProjectManagement() {
  const styles = useStyles();

  const handleProjectSelect = (project: Project) => {
    console.log(`打开项目: ${project.name}`);
    // 这里可以添加导航到项目详情页面的逻辑
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* 标题区域 */}
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to I18n Studio</h1>
          <p className={styles.subtitle}>
            创建新项目来开始国际化工作，或打开现有项目继续编辑
          </p>
        </div>

        {/* 操作区域 */}
        <div className={styles.actionsContainer}>
          <div className={styles.actionsGrid}>
            {/* 新建项目卡片 */}
            <div className={styles.actionCard}>
              <div className={styles.actionCardContent}>
                <CreateProjectDialog
                  onProjectCreated={() => {
                    console.log("项目创建成功");
                  }}
                />
              </div>
            </div>

            {/* 打开项目卡片 */}
            <OpenProjectDialog
              trigger={
                <div className={styles.actionCard}>
                  <div className={styles.actionCardContent}>
                    <FolderOpenRegular className={styles.actionIcon} />
                    <span className={styles.actionText}>打开项目</span>
                  </div>
                </div>
              }
              onProjectSelect={handleProjectSelect}
            />

            {/* 导入项目卡片 */}
            <div
              className={styles.actionCard}
              onClick={() => console.log("导入项目")}
            >
              <div className={styles.actionCardContent}>
                <DocumentRegular className={styles.actionIcon} />
                <span className={styles.actionText}>导入项目</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
