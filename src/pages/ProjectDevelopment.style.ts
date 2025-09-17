import { makeStyles, tokens } from "@fluentui/react-components";

export const useStyles = makeStyles({
  container: {
    height: "100vh",
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    display: "flex",
    overflow: "hidden",
  },
  leftPanel: {
    width: "300px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    overflow: "auto",
  },
  rightPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    padding: "16px 24px",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
  },
  projectTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  tableContainer: {
    flex: 1,
    padding: "16px 24px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  actionGroup: {
    display: "flex",
    gap: "12px",
    marginBottom: "16px",
    alignItems: "center",
  },
  tableWrapper: {
    flex: 1,
    overflow: "auto",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    "&::-webkit-scrollbar": {
      width: "8px",
      height: "8px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: tokens.colorNeutralBackground3,
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "transparent",
      borderRadius: "4px",
      transition: "background-color 0.2s ease",
    },
    "&:hover::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.colorNeutralStroke1,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: tokens.colorNeutralStroke2,
    },
  },
  searchSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  searchLabel: {
    fontSize: "14px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  progressSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  progressItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground2,
  },
  progressValue: {
    fontSize: "14px",
    fontWeight: 600,
    color: tokens.colorNeutralForeground1,
  },
  navigationSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navigationList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    maxHeight: "160px", // 4个项目的高度 (约40px * 4)
    overflow: "auto",
    "&::-webkit-scrollbar": {
      width: "6px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: tokens.colorNeutralBackground3,
      borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "transparent",
      borderRadius: "3px",
      transition: "background-color 0.2s ease",
    },
    "&:hover::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.colorNeutralStroke1,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: tokens.colorNeutralStroke2,
    },
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: tokens.borderRadiusSmall,
    cursor: "pointer",
    fontSize: "12px",
    backgroundColor: "transparent",
    border: "none",
    color: tokens.colorNeutralForeground2,
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  navIcon: {
    fontSize: "14px",
  },

  tableCell: {
    padding: "8px",
  },
  selectCell: {
    padding: "8px",
    width: "40px",
    minWidth: "40px",
    maxWidth: "40px",
  },
  keyInput: {
    width: "100%",
  },
  translationInput: {
    width: "100%",
  },
  toaster: {
    position: "fixed",
    top: "16px",
    right: "16px",
    zIndex: 1000,
  },
  // 高亮效果样式
  highlightRow: {
    backgroundColor: `${tokens.colorBrandBackgroundHover} !important`,
    transition: "background-color 0.3s ease",
  },
});
