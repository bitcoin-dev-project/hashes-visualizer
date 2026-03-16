import './App.css';
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import SHA256Page from './pages/SHA256';
import MerkleTreePage from './pages/MerkleTree';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sha256" element={<SHA256Page />} />
        <Route path="/merkle-tree" element={<MerkleTreePage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
