import { Toaster } from 'sonner'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'

function App() {
  return <><RouterProvider router={router} /><Toaster richColors position="top-right" /></>
}

export default App
