"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import "./dashboard.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Dashboard() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const [editId, setEditId] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);

  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");

  const [logFilter, setLogFilter] = useState("All");

  const filteredLogs =
    logFilter === "All"
      ? logs
      : logs.filter((log) => log.userEmail === logFilter);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) return router.push("/login");

      const docSnap = await getDoc(doc(db, "users", u.uid));
      const userRole = docSnap.data()?.role;

      setRole(userRole);
      fetchExpenses(u.uid, userRole);

      if (userRole === "admin") {
        fetchUsers();
        fetchLogs();
      }
    });

    return () => unsub();
  }, []);

  const fetchExpenses = async (uid, role) => {
    const q =
      role === "admin"
        ? query(collection(db, "expenses"))
        : query(collection(db, "expenses"), where("userId", "==", uid));

    const snap = await getDocs(q);
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    setExpenses(list);
  };

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    setUsers(list);
  };

  const fetchLogs = async () => {
    const q = query(collection(db, "logs"), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    setLogs(list);
  };

  const handleAddExpense = async () => {
    if (!amount || !category) return;

    await addDoc(collection(db, "expenses"), {
      amount: Number(amount),
      category,
      userId: user.uid,
      userEmail: user.email,
      createdAt: serverTimestamp(),
    });

    setAmount("");
    setCategory("");
    fetchExpenses(user.uid, role);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "expenses", id));
    fetchExpenses(user.uid, role);
  };

  const startEdit = (exp) => {
    setEditId(exp.id);
    setEditAmount(exp.amount);
    setEditCategory(exp.category);
  };

  const handleUpdate = async () => {
    await updateDoc(doc(db, "expenses", editId), {
      amount: Number(editAmount),
      category: editCategory,
    });

    setEditId("");
    fetchExpenses(user.uid, role);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const chartData = Object.values(
    expenses.reduce((acc, curr) => {
      if (!acc[curr.category]) {
        acc[curr.category] = { category: curr.category, total: 0 };
      }
      acc[curr.category].total += Number(curr.amount);
      return acc;
    }, {})
  );

  const totalExpense = expenses.reduce(
    (sum, exp) => sum + Number(exp.amount || 0),
    0
  );

  const handleExport = () => {
    const formattedData = expenses.map((exp) => ({
      Amount: exp.amount,
      Category: exp.category,
      User: exp.userEmail || exp.userId,
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "expenses.xlsx");
  };

  const makeAdmin = async (id) => {
    try {
      await updateDoc(doc(db, "users", id), {
        role: "admin",
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="layout">

      <div className="sidebar">
        <h2>💸 ExpenseApp</h2>

        <ul>
          <li className={activeTab==="dashboard"?"active":""} onClick={()=>setActiveTab("dashboard")}>
            📊 Dashboard
          </li>

          <li className={activeTab==="expenses"?"active":""} onClick={()=>setActiveTab("expenses")}>
            💸 Expenses
          </li>

          <li>
            <button className="btn-success export-btn" onClick={handleExport}>
              📥 Export to Excel
            </button>
          </li>

          {role==="admin" && (
            <li className={activeTab==="users"?"active":""} onClick={()=>setActiveTab("users")}>
              👤 Users
            </li>
          )}

          {role==="admin" && (
            <li className={activeTab==="logs"?"active":""} onClick={()=>setActiveTab("logs")}>
              📜 Logs
            </li>
          )}
        </ul>
      </div>

      <div className="main">

        <div className="header">
          <h1>{activeTab.toUpperCase()}</h1>
          <button className="btn-delete" onClick={handleLogout}>Logout</button>
        </div>

        {activeTab==="dashboard" && (
          <>
            <div className="card">
              <h2>Welcome {user.email}</h2>
            </div>

            <div className="card">
              <h3>Expense Analytics</h3>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* 🔥 EXPENSES (IMPROVED UI) */}
        {activeTab==="expenses" && (
          <div>
            <h2>Expenses</h2>

            <div className="card stats-card">
              <p className="stats-title">Total Expenses</p>
              <h2 className="stats-value">₹ {totalExpense}</h2>
            </div>

            <div className="form-card">
              <input type="number" placeholder="Amount" value={amount} onChange={(e)=>setAmount(e.target.value)} />
              <input type="text" placeholder="Category" value={category} onChange={(e)=>setCategory(e.target.value)} />
              <button className="btn-primary" onClick={handleAddExpense}>Add Expense</button>
            </div>

            {expenses.map((exp)=>(
              <div key={exp.id} className="card">
                {editId===exp.id ? (
                  <>
                    <input value={editAmount} onChange={(e)=>setEditAmount(e.target.value)} />
                    <input value={editCategory} onChange={(e)=>setEditCategory(e.target.value)} />
                    <button className="btn-primary" onClick={handleUpdate}>Save</button>
                    <button className="btn-delete" onClick={()=>setEditId("")}>Cancel</button>
                  </>
                ) : (
                  <>
                    <p className="amount">₹ {exp.amount}</p>
                    <p className="category">{exp.category}</p>
                    {role==="admin" && <p className="email">{exp.userEmail}</p>}

                    <div className="actions">
                      {(role==="admin" || exp.userId===user.uid) && (
                        <button className="btn-primary" onClick={()=>startEdit(exp)}>Edit</button>
                      )}
                      {(role==="admin" || exp.userId===user.uid) && (
                        <button className="btn-delete" onClick={()=>handleDelete(exp.id)}>Delete</button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* USERS + LOGS unchanged */}

        {activeTab==="users" && role==="admin" && (
  <div>
    <h2>Users List</h2>

    {users.map((u)=>(
      <div key={u.id} className="card">
        <p><strong>Email:</strong> {u.email}</p>
        <p><strong>Role:</strong> {u.role}</p>

        {u.role !== "admin" && (
          <button
            className="btn-primary make-admin-btn"
            onClick={()=>makeAdmin(u.id)}
          >
            Make Admin
          </button>
        )}
      </div>
    ))}
  </div>
)}

{activeTab==="logs" && role==="admin" && (
  <div>
    <h2>Logs</h2>

    <select value={logFilter} onChange={(e)=>setLogFilter(e.target.value)}>
      <option value="All">All</option>
      {users.map((u)=>(
        <option key={u.id} value={u.email}>{u.email}</option>
      ))}
    </select>

    {filteredLogs.map((log)=>(
      <div key={log.id} className="card">
        <p><strong>User:</strong> {log.userEmail}</p>
        <p><strong>Action:</strong> {log.action}</p>
        <p>
          <strong>Time:</strong>{" "}
          {log.timestamp?.toDate().toLocaleString()}
        </p>
      </div>
    ))}
  </div>
)}

      </div>
    </div>
  );
}