import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Upload } from './pages/Upload';
import { Preview } from './pages/Preview';
import { Processing } from './pages/Processing';
import { Results } from './pages/Results';
import { History } from './pages/History';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="upload" element={<Upload />} />
          <Route path="preview" element={<Preview />} />
          <Route path="processing/:jobId" element={<Processing />} />
          <Route path="processing" element={<Processing />} />
          <Route path="results/:jobId" element={<Results />} />
          <Route path="results" element={<Results />} />
          <Route path="history" element={<History />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
