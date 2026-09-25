import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Landing from './pages/Landing'
import Choose from './pages/Choose'
import Routes from './pages/Routes'
import Form from './pages/Form'
import Loading from './pages/Loading'
import MapPage from './pages/MapPage'
import Leaderboard from './pages/Leaderboard'
import AdminLayout from './admin/AdminLayout'
import AdminLogin from './admin/pages/Login'
import Dashboard from './admin/pages/Dashboard'
import Stores from './admin/pages/Stores'
import Offers from './admin/pages/Offers'
import RoutesAdmin from './admin/pages/RoutesAdmin'
import FormDesigner from './admin/pages/FormDesigner'
import Insights from './admin/pages/Insights'

const router = createBrowserRouter([
  // 旅客端(前台)
  { path: '/', element: <Landing /> },
  { path: '/choose', element: <Choose /> },
  { path: '/routes', element: <Routes /> },
  { path: '/form', element: <Form /> },
  { path: '/loading', element: <Loading /> },
  { path: '/map', element: <MapPage /> },
  { path: '/leaderboard', element: <Leaderboard /> },
  // 管理後台
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'stores', element: <Stores /> },
      { path: 'offers', element: <Offers /> },
      { path: 'routes', element: <RoutesAdmin /> },
      { path: 'form', element: <FormDesigner /> },
      { path: 'insights', element: <Insights /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
