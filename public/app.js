const { useState } = React;

function App() {
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!location.trim()) {
      setError('Please enter a location');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/plan-trip', { location });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>AI Travel Companion</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your travel location"
          value={location}
          onChange={e => setLocation(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Planning your trip...' : 'Plan My Trip'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className="result-section">
          <h2>Trip Plan for {result.location}</h2>
          <p><strong>Coordinates:</strong> {result.coordinates.lat.toFixed(4)}, {result.coordinates.lon.toFixed(4)}</p>

          <h3>Nearest Hotels:</h3>
          {result.hotels.length ? (
            result.hotels.map((hotel, i) => (
              <div key={i} className="hotel">
                <strong>{hotel.name}</strong><br />
                {hotel.address}<br />
                Distance: {hotel.distance_km} km
              </div>
            ))
          ) : (
            <p>No hotels found nearby.</p>
          )}

          <h3>Current Weather:</h3>
          {result.weather ? (
            <p>
              {result.weather.description}, {result.weather.temperature}°C<br />
              Wind: {result.weather.wind_speed} km/h, Humidity: {result.weather.humidity}%
            </p>
          ) : (
            <p>Weather data not available.</p>
          )}

          <h3>Taxi Booking:</h3>
          <p>{result.taxiBooking.message}</p>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
