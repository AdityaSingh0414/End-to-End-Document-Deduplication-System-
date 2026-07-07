import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../store';
import { router } from './router';

// Global Stylesheet imports
import '../styles/globals.css';
import '../styles/animations.css';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
};

export default App;
