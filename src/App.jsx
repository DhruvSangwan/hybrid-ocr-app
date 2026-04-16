import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import DownloadPage from "./pages/DownloadPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/download" element={<DownloadPage />} />
    </Routes>
  );
}
