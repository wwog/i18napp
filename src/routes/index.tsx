import { createBrowserRouter } from "react-router-dom";
import { MainLayout } from "../components/MainLayout";

const NotFound = () => (
  <div style={{ padding: 16 }}>
    <h3>未找到页面</h3>
    <p>您访问的页面不存在。</p>
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    children: [
      { index: true, element: <MainLayout /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
