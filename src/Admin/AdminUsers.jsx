// import React, { useState, useEffect } from 'react';
// import { 
//   collection, 
//   addDoc, 
//   getDocs, 
//   updateDoc, 
//   doc, 
//   deleteDoc,
//   query,
//   where 
// } from 'firebase/firestore';
// import { createUserWithEmailAndPassword } from 'firebase/auth';
// import { db, auth } from '../firebase/firebase.config';
// import { Plus, Search, Filter, Edit, Trash2, Eye, UserPlus } from 'lucide-react';

// const AdminUsers = () => {
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [showCreateForm, setShowCreateForm] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [filterRole, setFilterRole] = useState('all');

//   // New user form state
//   const [newUser, setNewUser] = useState({
//     email: '',
//     password: '',
//     firstName: '',
//     lastName: '',
//     role: 'user',
//     isAdmin: false
//   });

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const fetchUsers = async () => {
//     setLoading(true);
//     try {
//       const usersCollection = collection(db, 'users');
//       const usersSnapshot = await getDocs(usersCollection);
//       const usersList = usersSnapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setUsers(usersList);
//     } catch (error) {
//       console.error('Error fetching users:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateUser = async (e) => {
//     e.preventDefault();
//     setLoading(true);

//     try {
//       // 1. Create authentication user
//       const userCredential = await createUserWithEmailAndPassword(
//         auth, 
//         newUser.email, 
//         newUser.password
//       );

//       // 2. Create user document in Firestore
//       await addDoc(collection(db, 'users'), {
//         uid: userCredential.user.uid,
//         email: newUser.email,
//         firstName: newUser.firstName,
//         lastName: newUser.lastName,
//         role: newUser.role,
//         isAdmin: newUser.isAdmin,
//         createdAt: new Date().toISOString(),
//         status: 'active'
//       });

//       // 3. Reset form and refresh users list
//       setNewUser({
//         email: '',
//         password: '',
//         firstName: '',
//         lastName: '',
//         role: 'user',
//         isAdmin: false
//       });
//       setShowCreateForm(false);
//       fetchUsers();

//       alert('User created successfully!');

//     } catch (error) {
//       console.error('Error creating user:', error);
//       let errorMessage = 'Failed to create user. ';
      
//       switch (error.code) {
//         case 'auth/email-already-in-use':
//           errorMessage += 'Email already exists.';
//           break;
//         case 'auth/invalid-email':
//           errorMessage += 'Invalid email address.';
//           break;
//         case 'auth/weak-password':
//           errorMessage += 'Password is too weak.';
//           break;
//         default:
//           errorMessage += 'Please try again.';
//       }
      
//       alert(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value, type, checked } = e.target;
//     setNewUser(prev => ({
//       ...prev,
//       [name]: type === 'checkbox' ? checked : value
//     }));
//   };

//   const filteredUsers = users.filter(user => {
//     const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
//     const matchesRole = filterRole === 'all' || user.role === filterRole;
    
//     return matchesSearch && matchesRole;
//   });

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
//         <button
//           onClick={() => setShowCreateForm(true)}
//           className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
//         >
//           <UserPlus className="h-4 w-4" />
//           <span>Add User</span>
//         </button>
//       </div>

//       {/* Search and Filter */}
//       <div className="bg-white rounded-lg shadow-sm border p-4">
//         <div className="flex flex-col sm:flex-row gap-4">
//           <div className="relative flex-1">
//             <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search users..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//           <select
//             value={filterRole}
//             onChange={(e) => setFilterRole(e.target.value)}
//             className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           >
//             <option value="all">All Roles</option>
//             <option value="admin">Admin</option>
//             <option value="user">User</option>
//             <option value="moderator">Moderator</option>
//           </select>
//         </div>
//       </div>

//       {/* Create User Modal */}
//       {showCreateForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
//             <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            
//             <form onSubmit={handleCreateUser} className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     First Name
//                   </label>
//                   <input
//                     type="text"
//                     name="firstName"
//                     value={newUser.firstName}
//                     onChange={handleInputChange}
//                     required
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Last Name
//                   </label>
//                   <input
//                     type="text"
//                     name="lastName"
//                     value={newUser.lastName}
//                     onChange={handleInputChange}
//                     required
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Email
//                 </label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={newUser.email}
//                   onChange={handleInputChange}
//                   required
//                   className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-1">
//                   Password
//                 </label>
//                 <input
//                   type="password"
//                   name="password"
//                   value={newUser.password}
//                   onChange={handleInputChange}
//                   required
//                   minLength={8}
//                   className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Role
//                   </label>
//                   <select
//                     name="role"
//                     value={newUser.role}
//                     onChange={handleInputChange}
//                     className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                   >
//                     <option value="user">User</option>
//                     <option value="admin">Admin</option>
//                     <option value="moderator">Moderator</option>
//                   </select>
//                 </div>
//                 <div className="flex items-center justify-center">
//                   <label className="flex items-center space-x-2">
//                     <input
//                       type="checkbox"
//                       name="isAdmin"
//                       checked={newUser.isAdmin}
//                       onChange={handleInputChange}
//                       className="rounded text-blue-600 focus:ring-blue-500"
//                     />
//                     <span className="text-sm font-medium text-gray-700">Admin Privileges</span>
//                   </label>
//                 </div>
//               </div>

//               <div className="flex space-x-3 pt-4">
//                 <button
//                   type="submit"
//                   disabled={loading}
//                   className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
//                 >
//                   {loading ? 'Creating...' : 'Create User'}
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setShowCreateForm(false)}
//                   className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
//                 >
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Users Table */}
//       <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   User
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Role
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Status
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Created
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {filteredUsers.map((user) => (
//                 <tr key={user.id}>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
//                         {user.firstName?.[0]}{user.lastName?.[0]}
//                       </div>
//                       <div className="ml-4">
//                         <div className="text-sm font-medium text-gray-900">
//                           {user.firstName} {user.lastName}
//                         </div>
//                         <div className="text-sm text-gray-500">{user.email}</div>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className={`px-2 py-1 text-xs rounded-full font-medium ${
//                       user.role === 'admin' 
//                         ? 'bg-purple-100 text-purple-800'
//                         : user.role === 'moderator'
//                         ? 'bg-blue-100 text-blue-800'
//                         : 'bg-gray-100 text-gray-800'
//                     }`}>
//                       {user.role}
//                     </span>
//                     {user.isAdmin && (
//                       <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
//                         Admin
//                       </span>
//                     )}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
//                       Active
//                     </span>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
//                     {new Date(user.createdAt).toLocaleDateString()}
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                     <button className="text-blue-600 hover:text-blue-900 mr-3">
//                       <Eye className="h-4 w-4" />
//                     </button>
//                     <button className="text-blue-600 hover:text-blue-900 mr-3">
//                       <Edit className="h-4 w-4" />
//                     </button>
//                     <button className="text-red-600 hover:text-red-900">
//                       <Trash2 className="h-4 w-4" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
        
//         {filteredUsers.length === 0 && (
//           <div className="text-center py-12 text-gray-500">
//             No users found. {users.length === 0 ? 'Create your first user!' : 'Try a different search.'}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AdminUsers;