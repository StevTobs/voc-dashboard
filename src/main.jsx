import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { DataProvider } from './data/DataProvider.jsx';
import { FilterProvider } from './data/FilterProvider.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<React.StrictMode><DataProvider><FilterProvider><App /></FilterProvider></DataProvider></React.StrictMode>);
