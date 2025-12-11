// src/pages/inventory/details.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./inventory.css";

const API_BASE = "http://127.0.0.1:5000";

export default function InventoryDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    item_name: "",
    category_id: "",
    quantity: "",
    minimum_stock: "",
    supplier: "",
    expiration_date: "",
    notes: "",
  });

  useEffect(() => {
    fetchCategories();
    fetchItem();
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchItem = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory/${id}`);
      if (!res.ok) {
        throw new Error("Item not found");
      }
      const data = await res.json();
      setFormData({
        item_name: data.item_name || "",
        category_id: data.category_id || "",
        quantity: data.quantity || 0,
        minimum_stock: data.minimum_stock || 0,
        supplier: data.supplier || "",
        expiration_date: data.expiration_date || "",
        notes: data.notes || "",
      });
    } catch (err) {
      setError(err.message || "Failed to load item");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    // Validation
    if (!formData.item_name.trim()) {
      setError("Item name is required");
      setSaving(false);
      return;
    }

    if (!formData.category_id) {
      setError("Category is required");
      setSaving(false);
      return;
    }

    if (isNaN(formData.quantity) || parseInt(formData.quantity) < 0) {
      setError("Please enter a valid quantity");
      setSaving(false);
      return;
    }

    if (isNaN(formData.minimum_stock) || parseInt(formData.minimum_stock) < 0) {
      setError("Please enter a valid minimum stock level");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity),
          minimum_stock: parseInt(formData.minimum_stock),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update item");
      }

      setIsEditing(false);
      await fetchItem(); // Refresh data
    } catch (err) {
      setError(err.message || "An error occurred while updating the item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/inventory/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        navigate("/inventory");
      } else {
        throw new Error("Failed to delete item");
      }
    } catch (err) {
      setError(err.message || "An error occurred while deleting the item");
    }
  };

  const handleCancel = () => {
    if (isEditing) {
      setIsEditing(false);
      fetchItem(); // Reset form to original data
      setError("");
    } else {
      navigate("/inventory");
    }
  };

  if (loading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <div className="page">
            <p style={{ textAlign: "center", padding: "40px" }}>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  const categoryName = categories.find((c) => c.id === parseInt(formData.category_id))?.name || "N/A";
  const isLowStock = parseInt(formData.quantity) <= parseInt(formData.minimum_stock);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page">
          <header className="page-header">
            <h1>{isEditing ? "Edit Inventory Item" : "Inventory Item Details"}</h1>
            <div style={{ display: "flex", gap: "12px" }}>
              {!isEditing && (
                <>
                  <button
                    className="secondary-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit
                  </button>
                  <button
                    className="secondary-button"
                    onClick={handleDelete}
                    style={{ color: "#dc2626" }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </header>

          <div className="card form-card">
            {error && <div className="error-banner">{error}</div>}

            {isEditing ? (
              // EDIT MODE
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="item_name">
                    Item Name <span style={{ color: "red" }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="item_name"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="category_id">
                    Category <span style={{ color: "red" }}>*</span>
                  </label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="quantity">
                      Quantity <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="minimum_stock">
                      Minimum Stock Alert <span style={{ color: "red" }}>*</span>
                    </label>
                    <input
                      type="number"
                      id="minimum_stock"
                      name="minimum_stock"
                      value={formData.minimum_stock}
                      onChange={handleChange}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="supplier">Supplier</label>
                  <input
                    type="text"
                    id="supplier"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="expiration_date">Expiration Date</label>
                  <input
                    type="date"
                    id="expiration_date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="4"
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              // VIEW MODE
              <div>
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "16px" }}>
                    Item Information
                  </h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Item Name</p>
                      <p style={{ fontSize: "15px", fontWeight: "500" }}>{formData.item_name}</p>
                    </div>

                    <div>
                      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Category</p>
                      <p style={{ fontSize: "15px", fontWeight: "500" }}>{categoryName}</p>
                    </div>

                    <div>
                      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Current Quantity</p>
                      <p style={{ fontSize: "15px", fontWeight: "500" }}>
                        <span className={isLowStock ? "stock-low" : "stock-ok"}>
                          {formData.quantity}
                        </span>
                        {isLowStock && (
                          <span style={{ marginLeft: "8px", fontSize: "12px", color: "#dc2626" }}>
                            (Low Stock!)
                          </span>
                        )}
                      </p>
                    </div>

                    <div>
                      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Minimum Stock</p>
                      <p style={{ fontSize: "15px", fontWeight: "500" }}>{formData.minimum_stock}</p>
                    </div>

                    <div>
                      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Supplier</p>
                      <p style={{ fontSize: "15px", fontWeight: "500" }}>{formData.supplier || "N/A"}</p>
                    </div>

                    <div>
                      <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "4px" }}>Expiration Date</p>
                      <p style={{ fontSize: "15px", fontWeight: "500" }}>{formData.expiration_date || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {formData.notes && (
                  <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e5e7eb" }}>
                    <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>Notes</h3>
                    <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#374151" }}>
                      {formData.notes}
                    </p>
                  </div>
                )}

                <div className="form-actions">
                  <button className="secondary-button" onClick={handleCancel}>
                    Back to List
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}