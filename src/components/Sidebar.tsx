import React from 'react';
import {
  FolderRegular,
  SettingsRegular,
  WeatherMoonRegular,
  WeatherSunnyRegular,
} from "@fluentui/react-icons";
import { useTheme } from "../contexts/ThemeContext";
import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
  sidebar: {
    width: "200px",
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground3,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: "flex",
    flexDirection: "column",
    position: "fixed",
    left: 0,
    top: 0,
    zIndex: 1000,
    boxShadow: tokens.shadow4,
  },
  logo: {
    padding: "16px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    textAlign: "center",
    backgroundColor: tokens.colorNeutralBackground2,
  },
  logoText: {
    fontSize: "16px",
    fontWeight: 600,
    color: tokens.colorBrandBackground,
  },
  navigation: {
    flex: 1,
    padding: "8px 0",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    padding: "12px 22px 12px 0px",
    borderRadius: "0px",
    fontSize: "14px",
    fontWeight: "400",
    color: tokens.colorNeutralForeground1,
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  navItemActive: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: tokens.colorNeutralForegroundOnBrand,
    },
  },
  navIcon: {
    marginRight: "8px",
    fontSize: "16px",
  },
  footer: {
    padding: "16px",
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  themeToggle: {
    width: "100%",
    justifyContent: "flex-start",
    padding: "8px 16px",
    fontSize: "14px",
    fontWeight: "400",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    color: tokens.colorNeutralForeground1,
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
});

interface SidebarProps {
  activeTab: 'projects' | 'settings';
  onTabChange: (tab: 'projects' | 'settings') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const styles = useStyles();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.sidebar}>
      {/* Logo区域 */}
      <div className={styles.logo}>
        <div className={styles.logoText}>I18n Studio</div>
      </div>

      {/* 导航区域 */}
      <div className={styles.navigation}>
        <button
          className={`${styles.navItem} ${
            activeTab === 'projects' ? styles.navItemActive : ''
          }`}
          onClick={() => onTabChange('projects')}
        >
          <FolderRegular className={styles.navIcon} />
          Projects
        </button>
        
        <button
          className={`${styles.navItem} ${
            activeTab === 'settings' ? styles.navItemActive : ''
          }`}
          onClick={() => onTabChange('settings')}
        >
          <SettingsRegular className={styles.navIcon} />
          Settings
        </button>
      </div>

      {/* 底部主题切换 */}
      <div className={styles.footer}>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
        >
          {theme === "light" ? (
            <WeatherMoonRegular className={styles.navIcon} />
          ) : (
            <WeatherSunnyRegular className={styles.navIcon} />
          )}
          {theme === "light" ? "深色模式" : "浅色模式"}
        </button>
      </div>
    </div>
  );
};