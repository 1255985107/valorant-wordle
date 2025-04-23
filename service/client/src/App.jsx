import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SinglePlayer from './pages/SinglePlayer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/singleplayer" element={<SinglePlayer />} />
      </Routes>
    </Router>
  );
}

export default App;
