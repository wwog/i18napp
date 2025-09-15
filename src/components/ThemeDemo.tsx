import React from 'react';
import { 
  Card, 
  CardHeader, 
  Title2, 
  Body1,
  Button,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { useTheme } from '../contexts/ThemeContext';
import { WeatherMoonRegular, WeatherSunnyRegular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  container: {
    padding: "20px",
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: "100vh",
  },
  card: {
    maxWidth: "600px",
    margin: "0 auto",
    marginBottom: "20px",
  },
  themeInfo: {
    backgroundColor: tokens.colorNeutralBackground2,
    padding: "16px",
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: "16px",
  },
  colorDemo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "8px",
    marginTop: "16px",
  },
  colorItem: {
    padding: "8px",
    borderRadius: tokens.borderRadiusSmall,
    textAlign: "center",
    fontSize: "12px",
  },
});

export const ThemeDemo: React.FC = () => {
  const styles = useStyles();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={<Title2>主题系统演示</Title2>}
          action={
            <Button
              appearance="primary"
              icon={theme === 'light' ? <WeatherMoonRegular /> : <WeatherSunnyRegular />}
              onClick={toggleTheme}
            >
              切换到{theme === 'light' ? '深色' : '浅色'}模式
            </Button>
          }
        />
        
        <div className={styles.themeInfo}>
          <Body1>
            当前主题: <strong>{theme === 'light' ? '浅色模式' : '深色模式'}</strong>
          </Body1>
          <Body1>
            这个演示展示了 Fluent UI 主题系统如何自动适应不同的颜色模式。
          </Body1>
        </div>

        <Title2>Fluent UI 设计 Tokens</Title2>
        <div className={styles.colorDemo}>
          <div 
            className={styles.colorItem} 
            style={{ 
              backgroundColor: tokens.colorNeutralBackground1,
              color: tokens.colorNeutralForeground1,
              border: `1px solid ${tokens.colorNeutralStroke1}`
            }}
          >
            Background1
          </div>
          <div 
            className={styles.colorItem} 
            style={{ 
              backgroundColor: tokens.colorNeutralBackground2,
              color: tokens.colorNeutralForeground1,
              border: `1px solid ${tokens.colorNeutralStroke1}`
            }}
          >
            Background2
          </div>
          <div 
            className={styles.colorItem} 
            style={{ 
              backgroundColor: tokens.colorBrandBackground,
              color: tokens.colorNeutralForegroundOnBrand 
            }}
          >
            Brand
          </div>
          <div 
            className={styles.colorItem} 
            style={{ 
              backgroundColor: tokens.colorPaletteGreenBackground2,
              color: tokens.colorPaletteGreenForeground2 
            }}
          >
            Success
          </div>
          <div 
            className={styles.colorItem} 
            style={{ 
              backgroundColor: tokens.colorPaletteRedBackground2,
              color: tokens.colorPaletteRedForeground2 
            }}
          >
            Danger
          </div>
          <div 
            className={styles.colorItem} 
            style={{ 
              backgroundColor: tokens.colorPaletteYellowBackground2,
              color: tokens.colorPaletteYellowForeground2 
            }}
          >
            Warning
          </div>
        </div>
      </Card>
    </div>
  );
};