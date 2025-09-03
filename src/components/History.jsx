import React, { useState } from "react";
import dayjs from "dayjs";

export function History({ sessions, onDelete, onEdit, readOnly }) {
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editDistance, setEditDistance] = useState("");
  const perPage = 5;

  if (!sessions.length) return <p className="text-sm text-slate-600 dark:text-slate-300">Aucune séance enregistrée.</p>;

  const sorted = [...sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalPages = Math.ceil(sorted.length / perPage);
  const currentData = sorted.slice((page - 1) * perPage, page * perPage);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  const startEdit = (s) => {
    if (readOnly) return;
    setEditId(s.id); setEditDate(s.date); setEditDistance(s.distance);
  };
  const saveEdit = () => {
    if (readOnly) return;
    onEdit(editId, { date: editDate, distance: Number(editDistance) });
    setEditId(null);
  };

  const disabledCls = "opacity-60 cursor-not-allowed";

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 bg-white/80 backdrop-blur dark:ring-slate-700 dark:bg-slate-900/60">
      <div className="p-4">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Métrage (m)</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {currentData.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <td className="px-3 py-2 text-slate-900 dark:text-slate-100">
                  {editId === s.id ? (
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      disabled={readOnly}
                      className={`rounded-lg border border-slate-300 bg-white p-1.5 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${readOnly ? disabledCls : ""}`}
                    />
                  ) : (
                    dayjs(s.date).format("DD-MM-YYYY")
                  )}
                </td>
                <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">
                  {editId === s.id ? (
                    <input
                      type="number"
                      value={editDistance}
                      onChange={(e) => setEditDistance(e.target.value)}
                      disabled={readOnly}
                      className={`w-24 rounded-lg border border-slate-300 bg-white p-1.5 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${readOnly ? disabledCls : ""}`}
                    />
                  ) : (
                    s.distance
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {editId === s.id ? (
                    <div className="inline-flex gap-2">
                      <button
                        className={`rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white ${readOnly ? disabledCls : ""}`}
                        onClick={saveEdit}
                        disabled={readOnly}
                      >
                        Sauver
                      </button>
                      <button
                        className={`rounded-lg bg-slate-500 px-3 py-1.5 text-sm font-medium text-white ${readOnly ? disabledCls : ""}`}
                        onClick={() => setEditId(null)}
                        disabled={readOnly}
                      >
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex gap-2">
                      <button
                        className={`rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white ${readOnly ? disabledCls : ""}`}
                        onClick={() => startEdit(s)}
                        disabled={readOnly}
                      >
                        Modifier
                      </button>
                      <button
                        className={`rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white ${readOnly ? disabledCls : ""}`}
                        onClick={() => onDelete(s.id)}
                        disabled={readOnly}
                      >
                        Supprimer
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700">
          <button
            onClick={goPrev}
            disabled={page === 1}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700/60"
          >
            ◀ Précédent
          </button>
          <span className="text-sm">
            Page <span className="font-semibold">{page}</span> sur <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={goNext}
            disabled={page === totalPages}
            className="rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-slate-700/60"
          >
            Suivant ▶
          </button>
        </div>
      </div>
    </div>
  );
}

