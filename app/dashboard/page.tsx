"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/firebase/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import "./dashboard.css";

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
} from "firebase/firestore";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

export default function Dashboard() {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenses, setExpenses] = useState<any[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState("All");

  // 🔥 NEW STATES
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // 🔐 Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        fetchExpenses(currentUser.uid);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, []);

  // 📊 Filter logic
  useEffect(() => {
    if (filter === "All") {
      setFilteredExpenses(expenses);
    } else {
      setFilteredExpenses(
        expenses.filter((exp) => exp.category === filter)
      );
    }
  }, [filter, expenses]);

  // ➕ Add Expense
  const handleAddExpense = async () => {
    if (!user) return;

    await addDoc(collection(db, "expenses"), {
      amount: Number(amount),
      category,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });

    setAmount("");
    setCategory("");

    fetchExpenses(user.uid);
  };

  // 📥 Fetch
  const fetchExpenses = async (uid: string) => {
    const q = query(
      collection(db, "expenses"),
      where("userId", "==", uid)
    );

    const querySnapshot = await getDocs(q);
    const list: any[] = [];

    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() });
    });

    setExpenses(list);
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // 🗑 DELETE
  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, "expenses", id));
    if (user) fetchExpenses(user.uid);
  };

  // ✏️ START EDIT
  const handleEdit = (exp: any) => {
    setEditingId(exp.id);
    setEditAmount(exp.amount);
    setEditCategory(exp.category);
  };

  // 💾 UPDATE
  const handleUpdate = async (id: string) => {
    await updateDoc(doc(db, "expenses", id), {
      amount: Number(editAmount),
      category: editCategory,
    });

    setEditingId(null);
    if (user) fetchExpenses(user.uid);
  };

  if (!user) return <p>Loading...</p>;

  // 🔥 Chart Data
  const chartData = Object.values(
    filteredExpenses.reduce((acc: any, curr: any) => {
      if (!acc[curr.category]) {
        acc[curr.category] = { name: curr.category, value: 0 };
      }
      acc[curr.category].value += Number(curr.amount);
      return acc;
    }, {})
  );

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

  const total = filteredExpenses.reduce(
    (sum, exp) => sum + Number(exp.amount),
    0
  );

  return (
    <div className="container">

      {/* HEADER */}
      <div className="header">
        <h1 className="title">Dashboard</h1>
        <button className="logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* ADD */}
      <div className="form">
        <input
          className="input"
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <input
          className="input"
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <button className="button" onClick={handleAddExpense}>
          Add
        </button>
      </div>

      {/* FILTER */}
      <div className="filter">
        <label>Filter by Category: </label>
        <select
          className="input"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="All">All</option>

          {[...new Set(expenses.map((e) => e.category))].map(
            (cat, index) => (
              <option key={index} value={cat}>
                {cat}
              </option>
            )
          )}
        </select>
      </div>

      {/* TOTAL */}
      <div className="total">
        Total: ₹ {total}
      </div>

      {/* CHART */}
      <div className="chart">
        {chartData.length > 0 && (
          <PieChart width={400} height={400}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={120}
              dataKey="value"
              label
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </div>

      {/* LIST */}
      <div className="expenses">
        <h2>Your Expenses</h2>

        {filteredExpenses.map((exp) => (
          <div key={exp.id} className="card">

            {editingId === exp.id ? (
              <>
                <input
                  className="input"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />

                <input
                  className="input"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                />

                <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                  <button
                    className="button"
                    onClick={() => handleUpdate(exp.id)}
                  >
                    Save
                  </button>

                  <button
                    className="logout"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <p><strong>Amount:</strong> ₹ {exp.amount}</p>
                <p><strong>Category:</strong> {exp.category}</p>

                <div style={{ marginTop: "10px", display: "flex", gap: "10px" }}>
                  <button
                    className="button"
                    onClick={() => handleEdit(exp)}
                  >
                    Edit
                  </button>

                  <button
                    className="logout"
                    onClick={() => handleDelete(exp.id)}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}