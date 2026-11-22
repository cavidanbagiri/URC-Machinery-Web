import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from '../layouts/Layout';

import ProtectedRoute from '../components/auth/ProtectedRoute';
import PublicRoute from '../components/auth/PublicRoute';

import Auth from '../pages/Auth';
import Dashboard from '../pages/Dashboard';
import CommonCarsPage from '../pages/CommonCarsPage'
import DocumentTracking from '../pages/DocumentTracking'
import Maintenance from '../pages/Maintenance'
import MeterLogs from '../pages/MeterLogs'
import FuelLogs from '../pages/FuelLogs'
import RentalMachines from '../pages/RentalMachines'
import Isg from '../pages/Isg'
import Repair from '../pages/Repair'
import DailyFaults from '../pages/DailyFaults'
import Tires from '../pages/Tires'
import Forum from '../pages/Forum'
import Settings from '../pages/Settings'
import WarehouseStock from '../pages/WarehouseStock'
import Stock from '../pages/Stock'
import PurchaseRequests from '../pages/PurchaseRequests'
import Notifications from '../pages/Notifications'

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
        path: 'maintenance',
        element: (
          <ProtectedRoute>
            <Maintenance />
          </ProtectedRoute>
        ),
      },
      {
        path: 'document_tracking',
        element: (
          <ProtectedRoute>
            <DocumentTracking />
          </ProtectedRoute>
        ),
      },
      {
        path: 'meter_logs',
        element: (
          <ProtectedRoute>
            <MeterLogs />
          </ProtectedRoute>
        ),
      },
      {
        path: 'fuel_logs',
        element: (
          <ProtectedRoute>
            <FuelLogs />
          </ProtectedRoute>
        ),
      },
      {
        path: 'rental_machines',
        element: (
          <ProtectedRoute>
            <RentalMachines />
          </ProtectedRoute>
        ),
      },
      {
        path: 'isg',
        element: (
          <ProtectedRoute>
            <Isg />
          </ProtectedRoute>
        ),
      },
      {
        path: 'repair',
        element: (
          <ProtectedRoute>
            <Repair />
          </ProtectedRoute>
        ),
      },
      {
        path: 'daily_faults',
        element: (
          <ProtectedRoute>
            <DailyFaults />
          </ProtectedRoute>
        ),
      },
      {
        path: 'tires',
        element: (
          <ProtectedRoute>
            <Tires />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forum',
        element: (
          <ProtectedRoute>
            <Forum />
          </ProtectedRoute>
        ),
      },
      {
        path: 'stock',
        element: (
          <ProtectedRoute>
            <Stock />
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
        path: 'purchase_requests',
        element: (
          <ProtectedRoute>
            <PurchaseRequests />
          </ProtectedRoute>
        ),
      },
      {
        // Bookmark from the old name of this page ("Satın Alma Siparişleri").
        path: 'purchase_orders',
        element: <Navigate to="/purchase_requests" replace />,
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <Notifications />
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