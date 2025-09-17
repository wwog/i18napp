import { FolderOpenRegular } from "@fluentui/react-icons";
import { Project } from "../db/projects";
import { makeStyles, tokens, Toaster, useToastController } from "@fluentui/react-components";
import { CreateProjectDialog } from "../components/CreateProjectDialog";
import { OpenProjectDialog } from "../components/OpenProjectDialog";
import { ImportProjectDialog } from "../components/ImportProjectDialog";

const useStyles = makeStyles({
  container: {
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    marginLeft: "200px", // 为侧边栏留出空间
    overflow: "auto",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "40px 32px",
  },
  header: {
    textAlign: "center",
    marginBottom: "52px",
    position: "relative",
  },
  title: {
    fontSize: "32px",
    fontWeight: 400,
    color: tokens.colorNeutralForeground1,
    marginBottom: "16px",
  },
  subtitle: {
    fontSize: "16px",
    color: tokens.colorNeutralForeground2,
    marginBottom: "0",
  },
  actionsContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "60px",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
    maxWidth: "900px",
    width: "100%",
  },
  actionCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      border: `1px solid ${tokens.colorBrandBackground}`,
      backgroundColor: tokens.colorNeutralBackground1Hover,
      transform: "translateY(-1px)",
    },
  },
  actionCardContent: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "120px",
    flexDirection: "column",
    gap: "12px",
  },
  actionIcon: {
    fontSize: "48px",
    color: tokens.colorBrandBackground,
  },
  actionText: {
    fontSize: "16px",
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
  },
  projectsHeader: {
    display: "flex",
    alignItems: "center",
    marginBottom: "18px",
    gap: "12px",
  },
  projectsTitle: {
    fontSize: "20px",
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
  },
  projectsBadge: {
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  projectsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "16px",
  },
  projectCard: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      border: `1px solid ${tokens.colorBrandBackground}`,
      transform: "translateY(-1px)",
      boxShadow: tokens.shadow4,
    },
  },
  projectHeader: {
    padding: "16px 16px 8px 16px",
  },
  projectName: {
    fontSize: "16px",
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
    marginBottom: "4px",
  },
  projectDate: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
  },
  statusBadge: {
    fontSize: "12px",
  },
  statusCompleted: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2,
  },
  statusInProgress: {
    backgroundColor: tokens.colorPaletteYellowBackground2,
    color: tokens.colorPaletteYellowForeground2,
  },
  projectContent: {
    padding: "0 16px 16px 16px",
  },
  languageSection: {
    marginBottom: "16px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px",
  },
  sectionIcon: {
    fontSize: "14px",
    color: tokens.colorNeutralForeground2,
  },
  sectionLabel: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
  },
  languageTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
  },
  languageTag: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground1,
    fontSize: "11px",
    padding: "2px 8px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  progressSection: {
    // No additional styles needed as we'll use inline
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  progressBar: {
    marginBottom: "4px",
    "& > div": {
      backgroundColor: tokens.colorBrandBackground,
    },
  },
  progressText: {
    fontSize: "11px",
    color: tokens.colorNeutralForeground2,
  },
});


export default function ProjectManagement() {
  const styles = useStyles();
  const { dispatchToast } = useToastController();
  const toasterId = "project-management-toaster";

  const handleProjectSelect = (project: Project) => {
    console.log(`打开项目: ${project.name}`);
    // 这里可以添加导航到项目详情页面的逻辑
    // window.location.href = `/project/${project.id}`;
  };

  return (
    <div className={styles.container}>
      <Toaster toasterId={toasterId} />
      
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
              <CreateProjectDialog
                onProjectCreated={() => {
                  console.log("项目创建成功");
                }}
              />
            </div>

            {/* 打开项目卡片 */}
            <div className={styles.actionCard}>
              <OpenProjectDialog
                trigger={
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center", 
                      gap: "12px",
                      width: "100%",
                      height: "100%",
                      minHeight: "120px",
                    }}
                  >
                    <FolderOpenRegular className={styles.actionIcon} />
                    <span className={styles.actionText}>打开项目</span>
                  </div>
                }
                onProjectSelect={handleProjectSelect}
              />
            </div>

            {/* 导入项目卡片 */}
            <div className={styles.actionCard}>
              <ImportProjectDialog onProjectCreated={handleProjectSelect} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
