import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../layouts/Layout';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import PublicRoute from '../components/auth/PublicRoute';

import Auth from '../pages/Auth';
import Dashboard from '../pages/Dashboard';
import CommonCarsPage from '../pages/CommonCarsPage'
import Settings from '../pages/Settings'
import WarehouseStock from '../pages/WarehouseStock'
import PurchaseOrders from '../pages/PurchaseOrders'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'auth',
        element: (
          <PublicRoute>
            <Auth />
          </PublicRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        ),
      },
      {
        path: 'common_cars',
        element: (
          <ProtectedRoute>
            <CommonCarsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'warehouse_stock',
        element: (
          <ProtectedRoute>
            <WarehouseStock />
          </ProtectedRoute>
        ),
      },
      {
        path: 'purchase_orders',
        element: (
          <ProtectedRoute>
            <PurchaseOrders />
          </ProtectedRoute>
        ),
      },
      {
        index: true,
        // The dashboard is protected; always route through the guarded path.
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);

export default router;