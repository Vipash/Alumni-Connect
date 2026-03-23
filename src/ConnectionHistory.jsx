function ConnectionHistory({ user }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetch(`/api/connections/student/${user._id}`)
      .then(res => res.json())
      .then(data => setHistory(data));
  }, [user._id]);

  return (
    <div className="history-section">
      <h3>My Connection History 🕒</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Alumni</th>
            <th>Opportunity</th>
            <th>Method</th>
          </tr>
        </thead>
        <tbody>
          {history.map(conn => (
            <tr key={conn._id}>
              <td>{new Date(conn.connectedAt).toLocaleDateString()}</td>
              <td>{conn.alumni?.name} ({conn.alumni?.branch})</td>
              <td><strong>{conn.notice?.title}</strong> at {conn.notice?.company}</td>
              <td><span className="badge-pill">{conn.contactMethod}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {history.length === 0 && <p className="empty-msg">You haven't reached out to anyone yet. Start connecting!</p>}
    </div>
  );
}