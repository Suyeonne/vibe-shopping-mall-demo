import { Navigate, Route, Routes } from 'react-router-dom'
import Main from './pages/Main.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import Admin from './pages/admin/Admin.jsx'
import AdminOrders from './pages/admin/AdminOrders.jsx'
import AdminProducts from './pages/admin/AdminProducts.jsx'
import ProductForm from './pages/admin/ProductForm.jsx'
import Category from './pages/Category.jsx'
import NewCollection from './pages/NewCollection.jsx'
import About from './pages/About.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'
import Order from './pages/Order.jsx'
import Orders from './pages/Orders.jsx'
import OrderDetail from './pages/OrderDetail.jsx'
import MyPage from './pages/MyPage.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/new-collection" element={<NewCollection />} />
      <Route path="/about" element={<About />} />
      <Route path="/hat" element={<Category category="hat" />} />
      <Route path="/object" element={<Category category="object" />} />
      <Route path="/brooch" element={<Navigate to="/hat" replace />} />
      <Route path="/incense" element={<Navigate to="/object" replace />} />
      <Route path="/perfume" element={<Navigate to="/hat" replace />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/order" element={<Order />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:id" element={<OrderDetail />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/products/new" element={<ProductForm />} />
      <Route path="/admin/products/:id" element={<ProductForm />} />
    </Routes>
  )
}

export default App
