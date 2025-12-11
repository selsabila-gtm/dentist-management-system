// src/pages/inventory/list.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { FiSearch } from "react-icons/fi";
import "./inventory.css";
import Notifications from "../../components/notification/notifications";


const API_BASE = "http://127.0.0.1:5000";

export default function InventoryListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Error fetching inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems(items.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.item_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      item.category_id === parseInt(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page">
          <header className="page-header">
  <h1>Inventory</h1>

  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
    <Notifications onOpenItem={(id) => navigate(`/inventory/${id}`)} />
    <button
      className="primary-button"
      onClick={() => navigate("/inventory/add")}
    >
      Add New Item
    </button>
  </div>
</header>


          {/* Search and Filter */}
          <div className="inventory-controls">
            <div className="search-box">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search inventory"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Inventory Table */}
          <div className="card">
            {loading ? (
              <p style={{ textAlign: "center", padding: "20px" }}>
                Loading inventory...
              </p>
            ) : (
              <table className="appointments-table">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Minimum Stock</th>
                    <th>Supplier</th>
                    <th>Expiration Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.item_name}</td>
                      <td>{item.category_name || "—"}</td>
                      <td>
                        <span
                          className={
                            item.quantity <= item.minimum_stock
                              ? "stock-low"
                              : "stock-ok"
                          }
                        >
                          {item.quantity}
                        </span>
                      </td>
                      <td>{item.minimum_stock}</td>
                      <td>{item.supplier || "—"}</td>
                      <td>{item.expiration_date || "N/A"}</td>
                      <td className="actions-cell">
                        <button
                          className="link-button"
                          onClick={() => navigate(`/inventory/${item.id}`)}
                        >
                          View
                        </button>
                        {" | "}
                        <button
                          className="link-button"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: 16 }}>
                        No inventory items found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}