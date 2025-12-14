import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import "./summary.css";
import Sidebar from "../../components/Sidebar/Sidebar";

const API_BASE = "http://127.0.0.1:5000";

export default function PostSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // ✅ GET THE RETURN DATE FROM NAVIGATION STATE
  const returnDate = location.state?.returnDate;
  
  const isViewMode = new URLSearchParams(location.search).get("mode") === "view";

  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState("");

  const [prescriptions, setPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [availableInventory, setAvailableInventory] = useState([]);

  const [editingPresc, setEditingPresc] = useState(null);
  const [editingInv, setEditingInv] = useState(null);

  const [newPresc, setNewPresc] = useState(null);
  const [newInv, setNewInv] = useState(null);

  const [showDocRow, setShowDocRow] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("pdf");
  const [docFile, setDocFile] = useState(null);
  const [docError, setDocError] = useState(""); // SEPARATE STATE FOR DOC ERRORS

  const [hasExistingSummary, setHasExistingSummary] = useState(false);
  const userSavedRef = useRef(false);
  
  const [errors, setErrors] = useState({});

  // ✅ HELPER FUNCTION TO NAVIGATE BACK WITH DATE
  function navigateBackToCalendar() {
    if (returnDate) {
      navigate("/calendar", { state: { returnDate } });
    } else {
      navigate("/calendar");
    }
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/appointments/${id}/summary`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notes) setNotes(data.notes);
        if (data.prescriptions) setPrescriptions(data.prescriptions);
        if (data.documents) setDocuments(data.documents);
        if (data.inventory) setInventory(data.inventory);
        if (data.cost !== undefined) setCost(String(data.cost));

        const existed =
          (data.notes && data.notes.trim() !== "") ||
          (data.prescriptions && data.prescriptions.length > 0) ||
          (data.documents && data.documents.length > 0) ||
          (data.inventory && data.inventory.length > 0) ||
          (data.cost && data.cost > 0);

        setHasExistingSummary(existed);
      });

    fetch(`${API_BASE}/api/inventory`)
      .then((res) => res.json())
      .then((data) => setAvailableInventory(data))
      .catch((err) => console.error("Error loading inventory:", err));
  }, [id]);

  useEffect(() => {
    return () => {
      if (!isViewMode && !hasExistingSummary && !userSavedRef.current) {
        fetch(`${API_BASE}/api/appointments/${id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "scheduled" }),
        }).catch(err => console.error("Failed to revert status:", err));
      }
    };
  }, [id, hasExistingSummary, isViewMode]);

  /* PRESCRIPTIONS */
  function startEditPresc(index) {
    setEditingPresc({
      index,
      name: prescriptions[index].name,
      dosage: prescriptions[index].dosage,
      instructions: prescriptions[index].instructions,
      isNew: false,
    });
  }

  function addPrescription() {
    if (editingPresc || newPresc) return;
    setNewPresc({ name: "", dosage: "", instructions: "" });
  }

  function saveNewPrescription() {
    if (!newPresc.name.trim() || !newPresc.dosage.trim() || !newPresc.instructions.trim()) {
      alert("All prescription fields are required.");
      return;
    }

    setPrescriptions((prev) => [
      ...prev,
      {
        name: newPresc.name.trim(),
        dosage: newPresc.dosage.trim(),
        instructions: newPresc.instructions.trim(),
      },
    ]);

    setNewPresc(null);
  }

  function cancelNewPrescription() {
    setNewPresc(null);
  }

  function saveEditPresc() {
    if (!editingPresc.name.trim() || !editingPresc.dosage.trim() || !editingPresc.instructions.trim()) {
      alert("All prescription fields are required.");
      return;
    }

    const updated = [...prescriptions];
    updated[editingPresc.index] = {
      name: editingPresc.name.trim(),
      dosage: editingPresc.dosage.trim(),
      instructions: editingPresc.instructions.trim(),
    };

    setPrescriptions(updated);
    setEditingPresc(null);
  }

  function cancelEditPresc() {
    setEditingPresc(null);
  }

  function deletePresc(index) {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  }

  /* INVENTORY */
  function startEditInv(index) {
    const item = inventory[index];
    setEditingInv({
      index,
      item_id: item.item_id,
      item_name: item.item_name,
      quantity: item.quantity,
      isNew: false,
    });
  }

  function addInventoryItem() {
    if (editingInv || newInv) return;
    setNewInv({ item_id: "", item_name: "", quantity: "" });
  }

  function saveNewInv() {
    if (!newInv.item_id || !newInv.quantity) {
      alert("Item and quantity are required.");
      return;
    }

    const selectedItem = availableInventory.find(i => i.id === parseInt(newInv.item_id));
    if (!selectedItem) {
      alert("Invalid item selected.");
      return;
    }

    setInventory((prev) => [
      ...prev,
      {
        item_id: selectedItem.id,
        item_name: selectedItem.item_name,
        quantity: parseInt(newInv.quantity),
      },
    ]);

    setNewInv(null);
  }

  function cancelNewInv() {
    setNewInv(null);
  }

  function saveEditInv() {
    if (!editingInv.item_id || !editingInv.quantity) {
      alert("Item and quantity are required.");
      return;
    }

    const selectedItem = availableInventory.find(i => i.id === parseInt(editingInv.item_id));
    if (!selectedItem) {
      alert("Invalid item selected.");
      return;
    }

    const updated = [...inventory];
    updated[editingInv.index] = {
      item_id: selectedItem.id,
      item_name: selectedItem.item_name,
      quantity: parseInt(editingInv.quantity),
    };

    setInventory(updated);
    setEditingInv(null);
  }

  function cancelEditInv() {
    setEditingInv(null);
  }

  function deleteInv(index) {
    setInventory((prev) => prev.filter((_, i) => i !== index));
  }

  /* DOCUMENTS */
  function handleUploadDocument() {
    console.log("Upload clicked - docName:", docName, "docFile:", docFile);
    
    // Clear previous errors
    setDocError("");
    
    // Validation
    if (!docName.trim()) {
      console.log("Setting error: Document name required");
      setDocError("Document name is required.");
      return;
    }
    
    if (!docFile) {
      console.log("Setting error: File required");
      setDocError("Please choose a file to upload.");
      return;
    }

    // Validate file type
    const fileName = docFile.name.toLowerCase();
    if (docType === "pdf") {
      if (!fileName.endsWith(".pdf")) {
        console.log("Setting error: Invalid PDF");
        setDocError("Please select a PDF file.");
        return;
      }
    } else if (docType === "img") {
      const validImageExts = [".png", ".jpg", ".jpeg", ".gif"];
      const isValidImage = validImageExts.some(ext => fileName.endsWith(ext));
      if (!isValidImage) {
        console.log("Setting error: Invalid image");
        setDocError("Please select a valid image file (PNG, JPG, JPEG, or GIF).");
        return;
      }
    }

    console.log("Clearing errors, starting upload");

    // Create FormData
    const formData = new FormData();
    formData.append("name", docName.trim());
    formData.append("type", docType);
    formData.append("file", docFile);

    // Upload
    fetch(`${API_BASE}/api/appointments/${id}/documents`, {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }
        
        return data;
      })
      .then((data) => {
        // Success
        console.log("Upload successful:", data);
        setDocuments(data.documents);
        setDocName("");
        setDocFile(null);
        setDocError("");
        setShowDocRow(false);

        // Clear file input
        const input = document.getElementById("doc-file-input");
        if (input) input.value = "";
      })
      .catch((error) => {
        console.error("Upload error:", error);
        setDocError(`Failed to upload: ${error.message}`);
      });
  }

  function viewDoc(d) {
    window.open(`${API_BASE}${d.url}`, "_blank");
  }

  function deleteDoc(index) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  /* SAVE SUMMARY */
  function saveSummary() {
    const newErrors = {};

    if (!cost || cost.trim() === "") {
      newErrors.cost = "Cost is required";
    } else {
      const costValue = parseFloat(cost);
      if (isNaN(costValue) || costValue < 0) {
        newErrors.cost = "Cost must be a positive number";
      }
    }

    if (inventory.length === 0) {
      newErrors.inventory = "At least one inventory item is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {
      notes,
      prescriptions,
      documents,
      inventory,
      cost: parseFloat(cost),
    };

    fetch(`${API_BASE}/api/appointments/${id}/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        userSavedRef.current = true;
        // ✅ NAVIGATE BACK WITH DATE
        navigateBackToCalendar();
      })
      .catch(() => {
        setErrors({ submit: "Failed to save summary. Please try again." });
      });
  }

  /* CANCEL */
  function handleCancel() {
    userSavedRef.current = true;

    if (!hasExistingSummary) {
      fetch(`${API_BASE}/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "scheduled" }),
      })
        .finally(() => {
          // ✅ NAVIGATE BACK WITH DATE
          navigateBackToCalendar();
        });
    } else {
      // ✅ NAVIGATE BACK WITH DATE
      navigateBackToCalendar();
    }
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page summary-page">
        <h1 className="page-header">Post-Appointment Summary</h1>

        {/* NOTES */}
        <section className="card summary-section">
          <h2>Notes</h2>
          <textarea
            className="notes-textarea"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter appointment notes..."
          />
        </section>

        {/* COST */}
        <section className="card summary-section">
          <h2>Appointment Cost *</h2>
          <div className="cost-input-wrapper">
            <span className="cost-currency">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`cost-input ${errors.cost ? 'error' : ''}`}
              value={cost}
              onChange={(e) => {
                setCost(e.target.value);
                setErrors(prev => ({ ...prev, cost: undefined }));
              }}
              placeholder="0.00"
            />
          </div>
          {errors.cost && <div className="error-message">{errors.cost}</div>}
        </section>

        {/* PRESCRIPTIONS */}
        <section className="card summary-section">
          <h2>Prescriptions</h2>

          <table className="appointments-table">
            <thead>
              <tr>
                <th>Medication Name</th>
                <th>Dosage</th>
                <th>Instructions</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {prescriptions.map((p, idx) =>
                editingPresc && editingPresc.index === idx ? (
                  <tr key={idx}>
                    <td>
                      <input
                        className="table-edit-input"
                        value={editingPresc.name}
                        onChange={(e) =>
                          setEditingPresc({ ...editingPresc, name: e.target.value })
                        }
                      />
                    </td>

                    <td>
                      <input
                        className="table-edit-input"
                        value={editingPresc.dosage}
                        onChange={(e) =>
                          setEditingPresc({ ...editingPresc, dosage: e.target.value })
                        }
                      />
                    </td>

                    <td>
                      <input
                        className="table-edit-input"
                        value={editingPresc.instructions}
                        onChange={(e) =>
                          setEditingPresc({
                            ...editingPresc,
                            instructions: e.target.value,
                          })
                        }
                      />
                    </td>

                    <td>
                      <button className="link-button" onClick={saveEditPresc}>
                        Save
                      </button>
                      {" | "}
                      <button className="link-button" onClick={cancelEditPresc}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={idx}>
                    <td>{p.name}</td>
                    <td>{p.dosage}</td>
                    <td>{p.instructions}</td>
                    <td>
                      <button className="link-button" onClick={() => startEditPresc(idx)}>
                        Edit
                      </button>
                      {" | "}
                      <button className="link-button" onClick={() => deletePresc(idx)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}

              {newPresc && (
                <tr>
                  <td>
                    <input
                      className="table-edit-input"
                      value={newPresc.name}
                      onChange={(e) =>
                        setNewPresc({ ...newPresc, name: e.target.value })
                      }
                      placeholder="Medication name"
                    />
                  </td>

                  <td>
                    <input
                      className="table-edit-input"
                      value={newPresc.dosage}
                      onChange={(e) =>
                        setNewPresc({ ...newPresc, dosage: e.target.value })
                      }
                      placeholder="Dosage"
                    />
                  </td>

                  <td>
                    <input
                      className="table-edit-input"
                      value={newPresc.instructions}
                      onChange={(e) =>
                        setNewPresc({ ...newPresc, instructions: e.target.value })
                      }
                      placeholder="Instructions"
                    />
                  </td>

                  <td>
                    <button className="link-button" onClick={saveNewPrescription}>
                      Save
                    </button>
                    {" | "}
                    <button className="link-button" onClick={cancelNewPrescription}>
                      Cancel
                    </button>
                  </td>
                </tr>
              )}

              {prescriptions.length === 0 && !newPresc && (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "#94a3b8" }}>
                    No prescriptions added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <button className="secondary-button" onClick={addPrescription}>
            Add Medication
          </button>
        </section>







       // Replace the DOCUMENTS section in your component with this:

{/* DOCUMENTS */}
<section className="card summary-section">
  <h2>Documents</h2>

  <table className="appointments-table">
    <thead>
      <tr>
        <th>Document Name</th>
        <th>Document Type</th>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody>
      {documents.map((d, idx) => (
        <tr key={idx}>
          <td>{d.name}</td>
          <td>{d.type === "pdf" ? "PDF" : "Image"}</td>
          <td>
            <button className="link-button" onClick={() => viewDoc(d)}>
              View
            </button>
            {" | "}
            <button className="link-button" onClick={() => deleteDoc(idx)}>
              Delete
            </button>
          </td>
        </tr>
      ))}

      {documents.length === 0 && (
        <tr>
          <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8" }}>
            No documents added yet.
          </td>
        </tr>
      )}
    </tbody>
  </table>

  {!showDocRow && (
    <button className="secondary-button" onClick={() => setShowDocRow(true)}>
      Add Document
    </button>
  )}

  {showDocRow && (
    <div className="doc-inline-row">
      <input
        className="doc-inline-input"
        placeholder="Document name"
        value={docName}
        onChange={(e) => {
          setDocName(e.target.value);
          setDocError(""); // Clear error on change
        }}
      />

      <select
        className="doc-inline-select"
        value={docType}
        onChange={(e) => {
          setDocType(e.target.value);
          setDocError(""); // Clear error on change
        }}
      >
        <option value="pdf">PDF</option>
        <option value="img">Image</option>
      </select>

      <input
        id="doc-file-input"
        type="file"
        className="doc-inline-file"
        accept={docType === "pdf" ? ".pdf" : "image/*"}
        onChange={(e) => {
          setDocFile(e.target.files[0] || null);
          setDocError(""); // Clear error on change
        }}
      />

      <button className="primary-button" onClick={handleUploadDocument}>
        Upload
      </button>

      <button
        className="secondary-button"
        onClick={() => {
          setShowDocRow(false);
          setDocError(""); // Clear error on cancel
          setDocName("");
          setDocFile(null);
        }}
      >
        Cancel
      </button>
    </div>
  )}

  {/* DISPLAY DOCUMENT ERROR MESSAGE */}
  {docError && <div className="error-message" style={{ marginTop: "10px" }}>{docError}</div>}
</section>






        {/* INVENTORY */}
        <section className="card summary-section">
          <h2>Inventory Used *</h2>
          {errors.inventory && <div className="error-message">{errors.inventory}</div>}

          <table className="appointments-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {inventory.map((it, idx) =>
                editingInv && editingInv.index === idx ? (
                  <tr key={idx}>
                    <td>
                      <select
                        className="table-edit-input"
                        value={editingInv.item_id}
                        onChange={(e) =>
                          setEditingInv({ ...editingInv, item_id: e.target.value })
                        }
                      >
                        <option value="">Select Item</option>
                        {availableInventory.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.item_name} (Stock: {item.quantity})
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <input
                        className="table-edit-input"
                        type="number"
                        min="1"
                        value={editingInv.quantity}
                        onChange={(e) =>
                          setEditingInv({ ...editingInv, quantity: e.target.value })
                        }
                      />
                    </td>

                    <td>
                      <button className="link-button" onClick={saveEditInv}>
                        Save
                      </button>
                      {" | "}
                      <button className="link-button" onClick={cancelEditInv}>
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={idx}>
                    <td>{it.item_name}</td>
                    <td>{it.quantity}</td>
                    <td>
                      <button
                        className="link-button"
                        onClick={() => startEditInv(idx)}
                      >
                        Edit
                      </button>
                      {" | "}
                      <button
                        className="link-button"
                        onClick={() => deleteInv(idx)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )}

              {newInv && (
                <tr>
                  <td>
                    <select
                      className="table-edit-input"
                      value={newInv.item_id}
                      onChange={(e) =>
                        setNewInv({ ...newInv, item_id: e.target.value })
                      }
                    >
                      <option value="">Select Item</option>
                      {availableInventory.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.item_name} (Stock: {item.quantity})
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input
                      className="table-edit-input"
                      type="number"
                      min="1"
                      value={newInv.quantity}
                      onChange={(e) =>
                        setNewInv({ ...newInv, quantity: e.target.value })
                      }
                      placeholder="Quantity"
                    />
                  </td>

                  <td>
                    <button className="link-button" onClick={saveNewInv}>
                      Save
                    </button>
                    {" | "}
                    <button className="link-button" onClick={cancelNewInv}>
                      Cancel
                    </button>
                  </td>
                </tr>
              )}

              {inventory.length === 0 && !newInv && (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", color: "#94a3b8" }}>
                    No inventory items added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <button className="secondary-button" onClick={addInventoryItem}>
            Add Item
          </button>
        </section>

        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}

        {/* SAVE SUMMARY */}
        <div className="summary-actions">
          <button className="secondary-button" onClick={handleCancel}>
            Cancel
          </button>

          <button className="primary-button" onClick={saveSummary}>
            Save Summary
          </button>
        </div>
      </div>
    </div>
  );
}