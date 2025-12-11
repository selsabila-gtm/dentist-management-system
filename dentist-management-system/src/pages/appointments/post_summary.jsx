import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./summary.css";
import Sidebar from "../../components/Sidebar/Sidebar";

const API_BASE = "http://127.0.0.1:5000";

export default function PostSummary() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [notes, setNotes] = useState("");

  const [prescriptions, setPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [documents, setDocuments] = useState([]);

  // Editing states
  const [editingPresc, setEditingPresc] = useState(null);
  const [editingInv, setEditingInv] = useState(null);

  // For adding NEW prescriptions / inventory
  const [newPresc, setNewPresc] = useState(null);
  const [newInv, setNewInv] = useState(null);

  // Document upload UI
  const [showDocRow, setShowDocRow] = useState(false);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("pdf");
  const [docFile, setDocFile] = useState(null);

  // Track if this appointment already had a summary before opening this page
  const [hasExistingSummary, setHasExistingSummary] = useState(false);
  
  // NEW: Use ref to track if user actually saved
  const userSavedRef = useRef(false);

  // Load existing summary
  useEffect(() => {
    fetch(`${API_BASE}/api/appointments/${id}/summary`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notes) setNotes(data.notes);
        if (data.prescriptions) setPrescriptions(data.prescriptions);
        if (data.documents) setDocuments(data.documents);
        if (data.inventory) setInventory(data.inventory);

        // Was there already some content? (then it's an old completed appointment)
        const existed =
          (data.notes && data.notes.trim() !== "") ||
          (data.prescriptions && data.prescriptions.length > 0) ||
          (data.documents && data.documents.length > 0) ||
          (data.inventory && data.inventory.length > 0);

        setHasExistingSummary(existed);
      });
  }, [id]);

  // NEW: Cleanup on unmount - revert to scheduled if user didn't save
  useEffect(() => {
    return () => {
      // Only revert if this was a new summary AND user didn't click save
      if (!hasExistingSummary && !userSavedRef.current) {
        fetch(`${API_BASE}/api/appointments/${id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "scheduled" }),
        }).catch(err => console.error("Failed to revert status:", err));
      }
    };
  }, [id, hasExistingSummary]);

  /* ------------------------------------------------------ */
  /*                   PRESCRIPTIONS                        */
  /* ------------------------------------------------------ */

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
    if (
      !newPresc.name.trim() ||
      !newPresc.dosage.trim() ||
      !newPresc.instructions.trim()
    ) {
      alert("All fields are required.");
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
    if (
      !editingPresc.name.trim() ||
      !editingPresc.dosage.trim() ||
      !editingPresc.instructions.trim()
    ) {
      alert("All fields are required.");
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

  /* ------------------------------------------------------ */
  /*                       INVENTORY                        */
  /* ------------------------------------------------------ */

  function startEditInv(index) {
    setEditingInv({
      index,
      item: inventory[index].item,
      quantity: inventory[index].quantity,
      isNew: false,
    });
  }

  function addInventoryItem() {
    if (editingInv || newInv) return;
    setNewInv({ item: "", quantity: "" });
  }

  function saveNewInv() {
    if (!newInv.item.trim() || !newInv.quantity) {
      alert("Item and quantity are required.");
      return;
    }

    setInventory((prev) => [
      ...prev,
      {
        item: newInv.item.trim(),
        quantity: newInv.quantity,
      },
    ]);

    setNewInv(null);
  }

  function cancelNewInv() {
    setNewInv(null);
  }

  function saveEditInv() {
    if (!editingInv.item.trim() || !editingInv.quantity) {
      alert("Item and quantity are required.");
      return;
    }

    const updated = [...inventory];
    updated[editingInv.index] = {
      item: editingInv.item.trim(),
      quantity: editingInv.quantity,
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

  /* ------------------------------------------------------ */
  /*                       DOCUMENTS                        */
  /* ------------------------------------------------------ */

  function handleUploadDocument() {
    if (!docName.trim()) return alert("Document name required.");
    if (!docFile) return alert("Choose a file.");

    const formData = new FormData();
    formData.append("name", docName);
    formData.append("type", docType);
    formData.append("file", docFile);

    fetch(`${API_BASE}/api/appointments/${id}/documents`, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          return;
        }

        setDocuments(data.documents);

        // reset fields
        setDocName("");
        setDocFile(null);
        setShowDocRow(false);

        const input = document.getElementById("doc-file-input");
        if (input) input.value = "";
      });
  }

  function viewDoc(d) {
    window.open(`${API_BASE}${d.url}`, "_blank");
  }

  function deleteDoc(index) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  /* ------------------------------------------------------ */
  /*                     SAVE SUMMARY                       */
  /* ------------------------------------------------------ */

  function saveSummary() {
    // Block saving if EVERYTHING is empty
    const hasContent =
      (notes && notes.trim() !== "") ||
      prescriptions.length > 0 ||
      documents.length > 0 ||
      inventory.length > 0;

    if (!hasContent) {
      alert("Please fill at least one field before saving the summary.");
      return;
    }

    const payload = {
      notes,
      prescriptions,
      documents,
      inventory,
    };

    fetch(`${API_BASE}/api/appointments/${id}/summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        // Mark that user successfully saved
        userSavedRef.current = true;
        // backend sets status = completed here
        navigate("/calendar");
      })
      .catch(() => alert("Failed to save summary"));
  }

  /* ------------------------------------------------------ */
  /*                     CANCEL LOGIC                       */
  /* ------------------------------------------------------ */

  function handleCancel() {
  // Prevent cleanup from running
  userSavedRef.current = true;

  if (!hasExistingSummary) {
    fetch(`${API_BASE}/api/appointments/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "scheduled" }),
    })
      .finally(() => {
        navigate("/calendar");
      });
  } else {
    navigate("/calendar");
  }
}



  /* ------------------------------------------------------ */
  /*                     RENDER UI                          */
  /* ------------------------------------------------------ */

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
        />
      </section>

      {/* ------------------------------------------------------ */}
      {/*                     PRESCRIPTIONS                      */}
      {/* ------------------------------------------------------ */}
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
            {/* Existing Rows */}
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

            {/* New Prescription Row */}
            {newPresc && (
              <tr>
                <td>
                  <input
                    className="table-edit-input"
                    value={newPresc.name}
                    onChange={(e) =>
                      setNewPresc({ ...newPresc, name: e.target.value })
                    }
                  />
                </td>

                <td>
                  <input
                    className="table-edit-input"
                    value={newPresc.dosage}
                    onChange={(e) =>
                      setNewPresc({ ...newPresc, dosage: e.target.value })
                    }
                  />
                </td>

                <td>
                  <input
                    className="table-edit-input"
                    value={newPresc.instructions}
                    onChange={(e) =>
                      setNewPresc({ ...newPresc, instructions: e.target.value })
                    }
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
          </tbody>
        </table>

        <button className="secondary-button" onClick={addPrescription}>
          Add Medication
        </button>
      </section>

      {/* ------------------------------------------------------ */}
      {/*                        DOCUMENTS                       */}
      {/* ------------------------------------------------------ */}
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
              onChange={(e) => setDocName(e.target.value)}
            />

            <select
              className="doc-inline-select"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="pdf">PDF</option>
              <option value="img">Image</option>
            </select>

            <input
              id="doc-file-input"
              type="file"
              className="doc-inline-file"
              accept={docType === "pdf" ? ".pdf" : "image/*"}
              onChange={(e) => setDocFile(e.target.files[0] || null)}
            />

            <button className="primary-button" onClick={handleUploadDocument}>
              Upload
            </button>

            <button
              className="secondary-button"
              onClick={() => setShowDocRow(false)}
            >
              Cancel
            </button>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------ */}
      {/*                        INVENTORY                       */}
      {/* ------------------------------------------------------ */}
      <section className="card summary-section">
        <h2>Inventory Used</h2>

        <table className="appointments-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {/* Existing rows */}
            {inventory.map((it, idx) =>
              editingInv && editingInv.index === idx ? (
                <tr key={idx}>
                  <td>
                    <input
                      className="table-edit-input"
                      value={editingInv.item}
                      onChange={(e) =>
                        setEditingInv({ ...editingInv, item: e.target.value })
                      }
                    />
                  </td>

                  <td>
                    <input
                      className="table-edit-input"
                      type="number"
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
                  <td>{it.item}</td>
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

            {/* NEW inventory row */}
            {newInv && (
              <tr>
                <td>
                  <input
                    className="table-edit-input"
                    value={newInv.item}
                    onChange={(e) =>
                      setNewInv({ ...newInv, item: e.target.value })
                    }
                  />
                </td>

                <td>
                  <input
                    className="table-edit-input"
                    type="number"
                    value={newInv.quantity}
                    onChange={(e) =>
                      setNewInv({ ...newInv, quantity: e.target.value })
                    }
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
          </tbody>
        </table>

        <button className="secondary-button" onClick={addInventoryItem}>
          Add Item
        </button>
      </section>

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








