import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addLedgerEntry, addLedgerPayment, getLedgerEntries, deleteLedgerEntry } from "@/lib/database/ledger";
import { useInventory } from "@/hooks/useInventory";

// Payment types
const paymentTypes = ["Cash", "Bank Transfer", "Cheque"];

const Ledger: React.FC = () => {
  const { inventory } = useInventory();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New ledger entry form
  const [newEntry, setNewEntry] = useState({ client_name: "" });
  const [invoiceProducts, setInvoiceProducts] = useState([{ product_id: 0, quantity: 1 }]);
  // New payment forms per entry
  const [newPayments, setNewPayments] = useState<{ [entryId: number]: { type: string; amount: number; note: string } }>({});

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "cleared" | "pending">("all");

  // Calculate total from selected products
  const totalAmount = Math.round(invoiceProducts.reduce((sum, p) => {
    const prod = inventory.find(i => i.product_id === p.product_id);
    if (!prod) return sum;
    return sum + (prod.price_per_sqft * prod.tile_width * prod.tile_height * prod.tiles_per_box * p.quantity);
  }, 0));

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLedgerEntries();
      setEntries(data || []);
    } catch (err) {
      setError("Failed to fetch ledger entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const validProducts = invoiceProducts.filter(p => p.product_id && p.quantity > 0);
    if (!newEntry.client_name.trim() || totalAmount <= 0 || validProducts.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await addLedgerEntry({ client_name: newEntry.client_name, total_amount: totalAmount, products: validProducts });
      setNewEntry({ client_name: "" });
      setInvoiceProducts([{ product_id: 0, quantity: 1 }]);
      await fetchEntries();
    } catch (err: any) {
      setError(err?.message || JSON.stringify(err) || "Failed to add ledger entry");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async (entryId: number, e: React.FormEvent) => {
    e.preventDefault();
    const np = newPayments[entryId];
    if (!np || !np.amount || np.amount <= 0) return;
    setLoading(true);
    setError(null);
    try {
      await addLedgerPayment(entryId, { payment_type: np.type, amount: np.amount, note: np.note });
      setNewPayments((prev) => ({ ...prev, [entryId]: { type: "Cash", amount: 0, note: "" } }));
      await fetchEntries();
    } catch (err) {
      setError("Failed to add payment");
    } finally {
      setLoading(false);
    }
  };

  const handleProductChange = (idx: number, field: string, value: any) => {
    setInvoiceProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  const addProductRow = () => {
    setInvoiceProducts(prev => [...prev, { product_id: 0, quantity: 1 }]);
  };
  const removeProductRow = (idx: number) => {
    setInvoiceProducts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteEntry = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this ledger entry? This will also delete all its payments.")) return;
    setLoading(true);
    setError(null);
    try {
      await deleteLedgerEntry(id);
      await fetchEntries();
    } catch (err: any) {
      setError(err?.message || JSON.stringify(err) || "Failed to delete ledger entry");
    } finally {
      setLoading(false);
    }
  };

  // Filtered and searched entries
  const filteredEntries = entries.filter(entry => {
    const paid = (entry.ledger_payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    const pending = entry.total_amount - paid;
    const matchesSearch = entry.client_name?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "cleared") return pending <= 0;
    if (filter === "pending") return pending > 0;
    return true;
  });

  // Dashboard/Analytics summary
  const dashboard = React.useMemo(() => {
    let totalSales = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let cash = 0, bank = 0, cheque = 0;
    filteredEntries.forEach(entry => {
      const paid = (entry.ledger_payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
      totalSales += Number(entry.total_amount);
      totalReceived += paid;
      totalPending += Math.max(0, Number(entry.total_amount) - paid);
      (entry.ledger_payments || []).forEach((p: any) => {
        if (p.payment_type === 'Cash') cash += Number(p.amount);
        else if (p.payment_type === 'Bank Transfer') bank += Number(p.amount);
        else if (p.payment_type === 'Cheque') cheque += Number(p.amount);
      });
    });
    return { totalSales, totalReceived, totalPending, cash, bank, cheque };
  }, [filteredEntries]);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-6">Ledger</h2>
        {/* Dashboard/Analytics summary */}
        <div className="grid min-w-0 grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-50 rounded p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Total Sales</div>
            <div className="text-base sm:text-xl font-bold text-blue-700">₹{dashboard.totalSales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="bg-gray-50 rounded p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Total Received</div>
            <div className="text-base sm:text-xl font-bold text-green-700">₹{dashboard.totalReceived.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="bg-gray-50 rounded p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Total Pending</div>
            <div className="text-base sm:text-xl font-bold text-red-700">₹{dashboard.totalPending.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="bg-gray-50 rounded p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Received (Cash)</div>
            <div className="text-base sm:text-lg font-bold text-gray-700">₹{dashboard.cash.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="bg-gray-50 rounded p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Received (Bank Transfer)</div>
            <div className="text-base sm:text-lg font-bold text-gray-700">₹{dashboard.bank.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div className="bg-gray-50 rounded p-4 text-center">
            <div className="text-xs text-gray-500 mb-1">Received (Cheque)</div>
            <div className="text-base sm:text-lg font-bold text-gray-700">₹{dashboard.cheque.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
          <Input
            placeholder="Search client name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="sm:w-64"
          />
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button type="button" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>Show All</Button>
            <Button type="button" variant={filter === "cleared" ? "default" : "outline"} onClick={() => setFilter("cleared")}>Cleared Dues</Button>
            <Button type="button" variant={filter === "pending" ? "default" : "outline"} onClick={() => setFilter("pending")}>Pending Dues</Button>
          </div>
        </div>
        <form onSubmit={handleAddEntry} className="mb-8 space-y-4">
          <div>
            <Label>Client Name</Label>
            <Input value={newEntry.client_name} onChange={e => setNewEntry(ne => ({ ...ne, client_name: e.target.value }))} required />
          </div>
          <div>
            <Label>Products Sold</Label>
            {invoiceProducts.map((prod, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <select
                  className="border rounded px-2 py-1"
                  value={prod.product_id}
                  onChange={e => handleProductChange(idx, "product_id", Number(e.target.value))}
                  required
                >
                  <option value={0}>Select product</option>
                  {inventory.map(item => (
                    <option key={item.product_id} value={item.product_id}>
                      {item.brand} - {item.product_name}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min={1}
                  value={prod.quantity}
                  onChange={e => handleProductChange(idx, "quantity", Number(e.target.value))}
                  required
                  placeholder="Quantity (boxes)"
                />
                {invoiceProducts.length > 1 && (
                  <Button type="button" variant="outline" onClick={() => removeProductRow(idx)}>-</Button>
                )}
                {idx === invoiceProducts.length - 1 && (
                  <Button type="button" variant="outline" onClick={addProductRow}>+</Button>
                )}
              </div>
            ))}
          </div>
          <div>
            <Label>Total Bill Amount</Label>
            <div className="text-lg font-bold">₹{totalAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <Button type="submit" disabled={loading || totalAmount <= 0}>Create Invoice</Button>
        </form>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="space-y-8">
            {filteredEntries.length === 0 ? (
              <div className="text-gray-500">No ledger entries found.</div>
            ) : (
              filteredEntries.map((entry) => {
                const paid = (entry.ledger_payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);
                const pending = entry.total_amount - paid;
                const np = newPayments[entry.id] || { type: "Cash", amount: 0, note: "" };
                return (
                  <div key={entry.id} className="border rounded p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <div className="font-semibold">{entry.client_name}</div>
                        <div className="text-sm text-gray-500">Total: ₹{Math.round(Number(entry.total_amount)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Pending: </span>
                        <span className={`text-lg font-bold ${pending <= 0 ? "text-green-600" : "text-red-600"}`}>
                          ₹{Math.max(0, Math.round(pending)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="ml-2"
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={loading}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {entry.products && (
                      <div className="mb-2">
                        <Label>Products</Label>
                        <ul className="mb-2 list-disc ml-6">
                          {(Array.isArray(entry.products) ? entry.products : []).map((p: any, idx: number) => {
                            const prod = inventory.find((i) => i.product_id === p.product_id);
                            return (
                              <li key={idx}>{prod ? `${prod.brand} - ${prod.product_name}` : p.product_id} (Boxes: {p.quantity})</li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    <div className="mb-2">
                      <Label>Payments</Label>
                      <ul className="mb-2 list-disc ml-6">
                        {(entry.ledger_payments || []).map((p: any, idx: number) => (
                          <li key={p.id || idx}>{p.payment_type}: ₹{Math.round(Number(p.amount)).toLocaleString(undefined, { maximumFractionDigits: 0 })} {p.note ? <span className="text-xs text-gray-400">({p.note})</span> : null} <span className="text-xs text-gray-400">{p.payment_date}</span></li>
                        ))}
                      </ul>
                      <form onSubmit={e => handleAddPayment(entry.id, e)} className="flex gap-2 items-end">
                        <div>
                          <Label>Type</Label>
                          <select className="border rounded px-2 py-1" value={np.type} onChange={e => setNewPayments(prev => ({ ...prev, [entry.id]: { ...np, type: e.target.value } }))}>
                            {paymentTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Amount</Label>
                          <Input type="number" min={1} value={np.amount} onChange={e => setNewPayments(prev => ({ ...prev, [entry.id]: { ...np, amount: Number(e.target.value) } }))} />
                        </div>
                        <div>
                          <Label>Note</Label>
                          <Input value={np.note} onChange={e => setNewPayments(prev => ({ ...prev, [entry.id]: { ...np, note: e.target.value } }))} />
                        </div>
                        <Button type="submit" disabled={loading || pending <= 0}>Add Payment</Button>
                      </form>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Ledger; 