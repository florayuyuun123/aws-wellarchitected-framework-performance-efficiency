import { useState, useEffect } from 'react'
import { Coffee, Plus, Trash2, RefreshCw, Package, Edit2 } from 'lucide-react'
import './index.css'

// We will replace this with the real API Gateway URL once deployed
const API_URL = import.meta.env.VITE_API_URL || "https://714yimwoye.execute-api.us-east-1.amazonaws.com/Prod/inventory";

function App() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', category: 'beans', quantity: '', unit: 'kg' });
  const [isAdding, setIsAdding] = useState(false);

  // Mock data for development when API is not yet available
  const mockData = [
    { itemId: '1', name: 'Ethiopian Yirgacheffe', category: 'beans', quantity: 15, unit: 'kg', reorderLevel: 5 },
    { itemId: '2', name: 'Oat Milk', category: 'dairy', quantity: 24, unit: 'liters', reorderLevel: 10 },
    { itemId: '3', name: 'Paper Cups 12oz', category: 'packaging', quantity: 500, unit: 'units', reorderLevel: 100 },
  ];

  const fetchInventory = async () => {
    setLoading(true);
    if (!API_URL) {
      // Simulate network delay for mock data
      setTimeout(() => {
        setInventory(mockData);
        setLoading(false);
      }, 800);
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}`);
      const data = await res.json();
      setInventory(data.items || []);
    } catch (err) {
      console.error("Failed to fetch inventory", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.quantity) return;
    
    const newItem = {
      ...formData,
      quantity: parseInt(formData.quantity)
    };

    if (!API_URL) {
      setInventory([...inventory, { ...newItem, itemId: Date.now().toString() }]);
      setIsAdding(false);
      setFormData({ name: '', category: 'beans', quantity: '', unit: 'kg' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      if (res.ok) {
        fetchInventory();
        setIsAdding(false);
        setFormData({ name: '', category: 'beans', quantity: '', unit: 'kg' });
      }
    } catch (err) {
      console.error("Failed to add item", err);
    }
  };

  const handleDelete = async (id) => {
    if (!API_URL) {
      setInventory(inventory.filter(item => item.itemId !== id));
      return;
    }

    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      fetchInventory();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <div className="app-container">
      <header className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1><Coffee size={32} style={{ display: 'inline', marginRight: '10px', color: '#d88c51' }}/> Welcome To Flotech's Cafe</h1>
          <p style={{ color: 'var(--text-secondary)' }}>This is a Serverless CoffeeShop Inventory Manager</p>
        </div>
        <button onClick={fetchInventory}>
          {loading ? <div className="loader" /> : <><RefreshCw size={18} /> Refresh</>}
        </button>
      </header>

      {isAdding ? (
        <div className="glass-panel" style={{ animation: 'fadeIn 0.3s' }}>
          <h2><Plus size={24} /> Add New Inventory</h2>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Item Name</label>
              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Colombian Beans" required />
            </div>
            <div className="form-group" style={{ width: '150px' }}>
              <label>Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="beans">Coffee Beans</option>
                <option value="dairy">Dairy & Alt</option>
                <option value="packaging">Packaging</option>
                <option value="syrups">Syrups</option>
              </select>
            </div>
            <div className="form-group" style={{ width: '100px' }}>
              <label>Quantity</label>
              <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required min="0" />
            </div>
            <div className="form-group" style={{ width: '100px' }}>
              <label>Unit</label>
              <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                <option value="kg">kg</option>
                <option value="liters">liters</option>
                <option value="units">units</option>
              </select>
            </div>
            <div className="form-group" style={{ flexDirection: 'row', gap: '10px' }}>
              <button type="submit">Save Item</button>
              <button type="button" className="danger" onClick={() => setIsAdding(false)}>Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2><Package size={24} /> Current Stock</h2>
          <button onClick={() => setIsAdding(true)}><Plus size={18}/> Add Item</button>
        </div>
      )}

      {loading && !isAdding ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loader" style={{ width: '40px', height: '40px', borderWidth: '4px' }}/>
        </div>
      ) : (
        <div className="inventory-grid">
          {inventory.map(item => (
            <div key={item.itemId} className="glass-panel inventory-item">
              <div className="item-header">
                <span className="item-name">{item.name}</span>
                <span className="item-category">{item.category}</span>
              </div>
              <div className="item-stats">
                <div className="stat-box">
                  <span className="stat-value">{item.quantity}</span>
                  <span className="stat-label">{item.unit} in stock</span>
                </div>
                {item.quantity <= (item.reorderLevel || 10) && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 'bold' }}>Low Stock!</span>
                )}
              </div>
              <div className="item-actions">
                <button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}><Edit2 size={16}/></button>
                <button className="danger" onClick={() => handleDelete(item.itemId)}><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {inventory.length === 0 && (
            <div className="glass-panel" style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No inventory items found. Add some stock!
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
