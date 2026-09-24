// App.jsx
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import router from './routers/index.jsx';
import { checkSession } from './stores/user_slice.js';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check session on app mount (page refresh)
    const token = localStorage.getItem('access_token');
    if (token) {
      dispatch(checkSession());
    }
  }, []);

  return <RouterProvider router={router} />;
}

export default App;