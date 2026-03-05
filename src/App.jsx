import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import LocationPicker from './LocationPicker';
import 'leaflet/dist/leaflet.css';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [alumniList, setAlumniList] = useState([]);
  const [formData, setFormData] = useState({ name: '', company: '' });
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [user, setUser] = useState(null); 
  const [pendingList, setPendingList] = useState([]);

  const fetchAlumni = async () => {
    try {
      const response = await fetch('http://localhost:5000/get-alumni');
      const data = await response.json();
      setAlumniList(data);
    } catch (error) {
      console.error("Error fetching alumni:", error);
    }
  };

  useEffect(() => { fetchAlumni(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCoords) return alert("Please click on the map to set your location!");

    await fetch('http://localhost:5000/add-alumni', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.name,
        company: formData.company,
        location: { type: "Point", coordinates: [selectedCoords[1], selectedCoords[0]] } 
      })
    });

    alert("Registered Successfully! Waiting for Admin Approval.");
    setSelectedCoords(null);
    setFormData({ name: '', company: '' });
  };

  const filteredAlumni = alumniList.filter(alumni => 
    alumni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    alumni.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* SIDEBAR SECTION */}
      <div style={{ width: '350px', padding: '20px', background: 'white', boxShadow: '2px 0 5px rgba(0,0,0,0.1)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#333' }}>Alumni Connect</h2>
        <hr />
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/MBM_Logo.png" alt="University Logo" style={{ width: '150px', height: '150px' }} />
        </div>

        {!user ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p>Welcome! Please identify yourself:</p>
            <button onClick={() => setUser({ role: 'junior' })} style={{ padding: '10px', backgroundColor: '#6a0d6a', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Enter as Junior</button>
            <button onClick={() => setUser({ role: 'alumni' })} style={{ padding: '10px', backgroundColor: '#6a0d6a', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>I am an Alumnus</button>
            <div style={{ textAlign: 'center', margin: '10px 0', color: '#888' }}>— Admin Only —</div>
            <button 
              onClick={async () => {
                const password = prompt("Enter Admin Password:"); 
                if (password === "admin123") { 
                  try {
                    const res = await fetch('http://localhost:5000/get-pending');
                    const data = await res.json();
                    setPendingList(data);
                    setUser({ role: 'admin' });
                  } catch (err) { alert("Server error."); }
                } else { alert("Wrong password!"); }
              }} 
              style={{ padding: '10px', backgroundColor: '#343a40', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
            >
              Admin Dashboard
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Role: <strong>{user.role.toUpperCase()}</strong></span>
              <button onClick={() => setUser(null)} style={{ fontSize: '11px', cursor: 'pointer' }}>Logout</button>
            </div>
            <hr />

            {user.role === 'admin' ? (
              <div style={{ overflowY: 'auto', flexGrow: 1 }}>
                <h4>Pending Approvals</h4>
                {pendingList.length === 0 ? <p style={{ color: '#888' }}>No pending requests.</p> : (
                  pendingList.map(item => (
                    <div key={item._id} style={{ padding: '15px', border: '2px solid #d90479', marginBottom: '15px', borderRadius: '12px', background: '#fffaf0' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#6a0d6a', textTransform: 'uppercase', fontWeight: 'bold' }}>Alumnus Name</span>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{item.name}</div>
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#6a0d6a', textTransform: 'uppercase', fontWeight: 'bold' }}>Working At</span>
                        <div style={{ color: '#333', fontSize: '14px' }}>{item.company}</div>
                      </div>
                      <button onClick={async () => {
                        await fetch(`http://localhost:5000/approve-alumni/${item._id}`, { method: 'PATCH' });
                        setPendingList(pendingList.filter(p => p._id !== item._id));
                        fetchAlumni();
                      }} style={{ backgroundColor: '#6a0d6a', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
                        Verify & Approve
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : user.role === 'alumni' ? (
              <form onSubmit={handleSubmit}>
                <h4>Register Your Location</h4>
                <input type="text" placeholder="Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} />
                <input type="text" placeholder="Company" required value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ddd' }} />
                <button type="submit" style={{ width: '100%', padding: '12px', background: '#6a0d6a', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit Pin</button>
              </form>
            ) : (
              <div>
                <h4>Search Alumni</h4>
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ddd' }} />
                {filteredAlumni.map(alumni => (
                  <div key={alumni._id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>{alumni.name}</strong> - {alumni.company}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MAP SECTION */}
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <MapContainer center={[26.2389, 73.0243]} zoom={13} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {user && user.role === 'alumni' && <LocationPicker setCoords={setSelectedCoords} />}
          {selectedCoords && <Marker position={selectedCoords} />}
          {filteredAlumni.map((alumni) => (
            <Marker key={alumni._id} position={[alumni.location.coordinates[1], alumni.location.coordinates[0]]}>
              <Popup><strong>{alumni.name}</strong><br/>{alumni.company}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default App;