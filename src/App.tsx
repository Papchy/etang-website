import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Wall from "./pages/Wall";
import CheckIn from "./pages/CheckIn";
import Admin from "./pages/Admin";
import ShoppingList from "./pages/ShoppingList";
import Guests from "./pages/Guests";
import Peche from "./pages/Peche";

export default function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="wall" element={<Wall />} />
            <Route path="checkin" element={<CheckIn />} />
            <Route path="/guests" element={<Guests />} />
            <Route path="/shopping" element={<ShoppingList />} />
            <Route path="admin" element={<Admin />} />
            <Route path="/peche" element={<Peche />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}