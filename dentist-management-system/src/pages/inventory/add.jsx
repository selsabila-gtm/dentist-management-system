import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/sidebar/sidebar";
import "./inventory.css";

const API_BASE = "http://127.0.0.1:5000";

export default function InventoryAddPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    item_name: "",
    category_id: "",
    quantity: "",
    minimum_stock: "",
    supplier: "",
    expiration_date: "",
    notes: "",
    price_per_unit: "", 
  });

  const [showModal, setShowModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/inventory/categories`);
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      setCategories(data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openAddCategoryModal = () => {
    setNewCategoryName("");
    setCategoryError("");
    setShowModal(true);
  };

  const closeModal = useCallback(() => {
    setShowModal(false);
    setNewCategoryName("");
    setCategoryError("");
    setAddingCategory(false);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && showModal) closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal, closeModal]);

  const validateCategoryName = (name) => {
    if (!name || !name.trim()) return "Category name is required.";
    if (name.trim().length < 2) return "Category name must be at least 2 characters.";
    const exists = categories.some((c) => (c.name || "").toLowerCase() === name.trim().toLowerCase());
    if (exists) return "A category with that name already exists.";
    return "";
  };

  const handleAddCategory = async () => {
    const name = (newCategoryName || "").trim();
    const v = validateCategoryName(name);
    setCategoryError(v);
    if (v) return;

    setAddingCategory(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventory/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) {
        const serverErr = data && (data.error || data.detail);
        setCategoryError(serverErr || "Failed to create category");
        setAddingCategory(false);
        return;
      }

      setCategories((prev) => [...prev, data]);
      setFormData((prev) => ({ ...prev, category_id: String(data.id) }));
      closeModal();
    } catch (err) {
      console.error("Error creating category:", err);
      setCategoryError("Network error while creating category");
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.item_name.trim()) {
      setError("Item name is required");
      setLoading(false);
      return;
    }

    if (!formData.category_id) {
      setError("Category is required");
      setLoading(false);
      return;
    }

    if (!formData.quantity || isNaN(formData.quantity) || parseInt(formData.quantity) < 0) {
      setError("Please enter a valid quantity");
      setLoading(false);
      return;
    }

    if (!formData.minimum_stock || isNaN(formData.minimum_stock) || parseInt(formData.minimum_stock) < 0) {
      setError("Please enter a valid minimum stock level");
      setLoading(false);
      return;
    }

    if (formData.price_per_unit !== "" && (isNaN(formData.price_per_unit) || parseFloat(formData.price_per_unit) < 0)) {
      setError("Please enter a valid non-negative price per unit");
      setLoading(false);
      return;
    }

    try {
      const body = {
        ...formData,
        quantity: parseInt(formData.quantity),
        minimum_stock: parseInt(formData.minimum_stock),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        price_per_unit: formData.price_per_unit === "" ? null : parseFloat(formData.price_per_unit),
      };

      const res = await fetch(`${API_BASE}/api/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let errorData;
        try { errorData = await res.json(); } catch {}
        throw new Error((errorData && (errorData.error || errorData.detail)) || "Failed to create item");
      }

      navigate("/inventory");
    } catch (err) {
      setError(err.message || "An error occurred while creating the item");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/inventory");
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page">
          <header className="page-header">
            <h1>Add New Inventory Item</h1>
          </header>

          <div className="card form-card">
            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} noValidate>
              {/* Item Name */}
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
                  placeholder="Enter item name"
                  required
                />
              </div>

              {/* Category with modal trigger */}
              <div className="form-group">
                <label htmlFor="category_id">
                  Category <span style={{ color: "red" }}>*</span>
                </label>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                    style={{ flex: 1 }}
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={openAddCategoryModal}
                    aria-haspopup="dialog"
                  >
                    + Add Category
                  </button>
                </div>
              </div>

              {/* Quantity and Minimum Stock */}
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
                    placeholder="Enter quantity"
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
                    placeholder="Enter minimum stock alert"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Price per unit */}
              <div className="form-group">
                <label htmlFor="price_per_unit">Price per Unit</label>
                <input
                  type="number"
                  id="price_per_unit"
                  name="price_per_unit"
                  value={formData.price_per_unit}
                  onChange={handleChange}
                  placeholder="e.g. 12.50"
                  min="0"
                  step="0.01"
                />
                <small style={{ color: "#6b7280" }}>Optional. Leave empty if not tracked.</small>
              </div>

              {/* Supplier */}
              <div className="form-group">
                <label htmlFor="supplier">Supplier</label>
                <input
                  type="text"
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="Enter supplier name"
                />
              </div>

              {/* Expiration Date */}
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

              {/* Notes */}
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes (optional)"
                  rows="4"
                />
              </div>

              {/* Form Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Add Category Modal */}
      {showModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="addCategoryTitle">
          <div className="modal">
            <h2 id="addCategoryTitle">Add New Category</h2>

            <label htmlFor="newCategoryName">Category name</label>
            <input
              id="newCategoryName"
              type="text"
              value={newCategoryName}
              onChange={(e) => {
                setNewCategoryName(e.target.value);
                if (categoryError) setCategoryError("");
              }}
              placeholder="e.g. Consumables"
              autoFocus
            />
            {categoryError && <div className="field-error">{categoryError}</div>}

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                type="button"
                className="primary-button"
                onClick={handleAddCategory}
                disabled={addingCategory}
              >
                {addingCategory ? "Saving..." : "Save Category"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={closeModal}
                disabled={addingCategory}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
