// Products.js
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, X, Trash2 } from 'lucide-react';
import { db } from '../../../firebase/firebase.config'; // Adjust path as needed
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', features: [], description: '', status: '', billingCycle: 'monthly' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productList);
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      price: product.price,
      features: product.features || [],
      description: product.description,
      status: product.status,
      billingCycle: product.billingCycle || 'monthly',
    });
  };

  const handleSave = async (id) => {
    try {
      const productRef = doc(db, 'products', id);
      await updateDoc(productRef, {
        name: editForm.name,
        price: parseFloat(editForm.price) || 0,
        features: editForm.features,
        description: editForm.description,
        status: editForm.status,
        billingCycle: editForm.billingCycle,
      });
      toast.success('Product updated successfully');
      fetchProducts();
      setEditingId(null);
    } catch (error) {
      toast.error('Failed to update product');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleAddProduct = async () => {
    try {
      await addDoc(collection(db, 'products'), {
        name: 'New Plan',
        price: 0,
        features: [],
        description: 'New product description',
        status: 'Draft',
        billingCycle: 'monthly',
      });
      toast.success('New product added');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to add product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...editForm.features];
    newFeatures[index] = value;
    setEditForm({ ...editForm, features: newFeatures });
  };

  const addFeature = () => {
    setEditForm({ ...editForm, features: [...editForm.features, ''] });
  };

  const removeFeature = (index) => {
    const newFeatures = editForm.features.filter((_, i) => i !== index);
    setEditForm({ ...editForm, features: newFeatures });
  };

  if (loading) return <div>Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
        <button
          onClick={handleAddProduct}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-6 rounded-lg shadow-sm border">
            {editingId === product.id ? (
              <>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="font-semibold text-gray-900 mb-2 w-full border-b"
                />
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="text-gray-600 text-sm mb-4 w-full border-b"
                />
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                  className="text-2xl font-bold text-gray-900 mb-4 w-full border-b"
                />
                <select
                  value={editForm.billingCycle}
                  onChange={(e) => setEditForm({ ...editForm, billingCycle: e.target.value })}
                  className="mb-4 w-full border-b"
                >
                  <option value="monthly">Monthly</option>
                  <option value="6month">6 Months</option>
                  <option value="yearly">Yearly</option>
                </select>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {editForm.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleFeatureChange(idx, e.target.value)}
                        className="flex-1 border-b"
                      />
                      <button onClick={() => removeFeature(idx)} className="text-red-600 ml-2">Remove</button>
                    </div>
                  ))}
                  <button onClick={addFeature} className="text-blue-600">Add Feature</button>
                </div>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="mb-4 w-full border-b"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
                <div className="flex space-x-2">
                  <button onClick={() => handleSave(product.id)} className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-1" /> Save
                  </button>
                  <button onClick={handleCancel} className="flex-1 text-red-600 border border-red-600 px-3 py-2 rounded text-sm hover:bg-red-50">
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700">
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      product.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {product.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                <div className="text-2xl font-bold text-gray-900 mb-4">${product.price.toFixed(2)}/{product.billingCycle}</div>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {product.features.map((feature, idx) => (
                    <div key={idx}>• {feature}</div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 text-blue-600 border border-blue-600 px-3 py-2 rounded text-sm hover:bg-blue-50"
                  >
                    <Edit2 className="h-4 w-4 mr-1" /> Edit
                  </button>
                  <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700">
                    {product.status === 'Draft' ? 'Publish' : 'View Details'}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;