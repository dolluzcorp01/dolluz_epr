import { BrowserRouter, Routes, Route } from "react-router-dom";
import DolluzEPRPortal from "./DolluzEPRPortal";
import DolluzStakeholderForm from "./DolluzStakeholderForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/review" element={<DolluzStakeholderForm />} />
        <Route path="/:page" element={<DolluzEPRPortal />} />
        <Route path="/" element={<DolluzEPRPortal />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
