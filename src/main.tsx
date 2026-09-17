import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Landing from './pages/Landing'
import Choose from './pages/Choose'
import Form from './pages/Form'
import Loading from './pages/Loading'
import MapPage from './pages/MapPage'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/choose', element: <Choose /> },
  { path: '/form', element: <Form /> },
  { path: '/loading', element: <Loading /> },
  { path: '/map', element: <MapPage /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
