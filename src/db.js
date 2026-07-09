/* eslint-disable */
import { db } from "./firebase";
import {
  doc, getDoc, setDoc,
  collection, addDoc, deleteDoc,
  onSnapshot, query, orderBy
} from "firebase/firestore";
import { DEFAULT_PROFILES, DEFAULT_EXPENSE_CATS, DEFAULT_INCOME_SRCS } from "./constants";

// ─── CONFIG (profiles, cats, sources) ────────────────────────────
export async function loadConfig() {
  const snap = await getDoc(doc(db, "config", "main"));
  if (snap.exists()) return snap.data();
  // First time: write defaults
  const defaults = {
    profiles: DEFAULT_PROFILES,
    expenseCats: DEFAULT_EXPENSE_CATS,
    incomeSrcs: DEFAULT_INCOME_SRCS,
  };
  await setDoc(doc(db, "config", "main"), defaults);
  return defaults;
}

export async function saveConfig(data) {
  await setDoc(doc(db, "config", "main"), data, { merge: true });
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────
export async function addTransaction(tx) {
  await addDoc(collection(db, "transactions"), tx);
}

export async function deleteTransaction(id) {
  await deleteDoc(doc(db, "transactions", id));
}

export function subscribeTransactions(callback) {
  const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const txs = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
    callback(txs);
  });
}

// ─── PROJECTS ────────────────────────────────────────────────────
export async function addProject(proj) {
  await addDoc(collection(db, "projects"), proj);
}

export async function deleteProject(id) {
  await deleteDoc(doc(db, "projects", id));
}

export function subscribeProjects(callback) {
  const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const projs = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
    callback(projs);
  });
}
