import React from 'react';
import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  container: {
    padding: "40px",
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground1,
    marginLeft: "200px", // 为侧边栏留出空间
    overflow: "auto",
  },
  title: {
    fontSize: "24px",
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
    marginBottom: "24px",
  },
  section: {
    marginBottom: "32px",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
    marginBottom: "16px",
  },
  placeholder: {
    padding: "20px",
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    textAlign: "center",
    color: tokens.colorNeutralForeground2,
  },
});

export const SettingsPage: React.FC = () => {
  const styles = useStyles();

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>设置</h1>
      
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>常规设置</h2>
        <div className={styles.placeholder}>
          常规设置选项将在这里显示
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>语言设置</h2>
        <div className={styles.placeholder}>
          语言配置选项将在这里显示
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>翻译设置</h2>
        <div className={styles.placeholder}>
          翻译相关设置将在这里显示
        </div>
      </div>
    </div>
  );
};