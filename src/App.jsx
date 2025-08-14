// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';  // Import BrowserRouter
import Navbar from './Components/Common/Navbar';
import AppRoutes from './Routes';  // Assuming you have routing set up

function App() {
  return (
    <BrowserRouter> 
      
        <AppRoutes /> 

    
    </BrowserRouter>
  );
}

export default App;
