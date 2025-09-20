const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Your API keys
const GEOAPIFY_API_KEY = 'SECRET';
const WEATHERSTACK_API_KEY = 'SECRET';

// Function to calculate distance between two lat/lon points using the Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  // Check for invalid coordinates
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.error('Invalid coordinates:', lat1, lon1, lat2, lon2);
    return "Invalid Coordinates"; // Return a fallback if coordinates are invalid
  }

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2); // Return distance in kilometers (rounded to 2 decimals)
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API endpoint to generate trip plan
app.post('/api/plan-trip', async (req, res) => {
  try {
    const { location } = req.body;
    if (!location) return res.status(400).json({ error: 'Location is required' });

    // 1. Get coordinates from Geoapify
    const geoRes = await axios.get(`https://api.geoapify.com/v1/geocode/search`, {
      params: { text: location, apiKey: GEOAPIFY_API_KEY }
    });

    if (!geoRes.data.features.length) return res.status(404).json({ error: 'Location not found' });

    const { lat, lon } = geoRes.data.features[0].properties;
    console.log('Coordinates for location:', lat, lon); // Debugging log

    // 2. Get nearest hotels (limit 5)
    const hotelsRes = await axios.get(`https://api.geoapify.com/v2/places`, {
      params: {
        categories: 'accommodation.hotel',
        filter: `circle:${lon},${lat},5000`, // 5 km radius
        limit: 5,
        apiKey: GEOAPIFY_API_KEY
      }
    });

    // Map hotels and calculate the distance in kilometers
    const hotels = hotelsRes.data.features.map(f => {
      const hotelLat = f.properties.lat;
      const hotelLon = f.properties.lon;
      const distanceKm = calculateDistance(lat, lon, hotelLat, hotelLon); // Calculate distance

      return {
        name: f.properties.name,
        address: f.properties.address_line1 || '',
        distance_km: distanceKm === "Invalid Coordinates" ? "N/A" : distanceKm, // Handle invalid coordinates
        lat: hotelLat,
        lon: hotelLon,
      };
    });

    // 3. Get current weather from Weatherstack
    const weatherRes = await axios.get(`http://api.weatherstack.com/current`, {
      params: {
        access_key: WEATHERSTACK_API_KEY,
        query: `${lat},${lon}`
      }
    });

    const weather = weatherRes.data.current ? {
      temperature: weatherRes.data.current.temperature,
      description: weatherRes.data.current.weather_descriptions[0],
      wind_speed: weatherRes.data.current.wind_speed,
      humidity: weatherRes.data.current.humidity,
    } : null;

    // 4. Simulate taxi booking info
    const taxiBooking = {
      taxiId: 'TX' + Math.floor(Math.random() * 10000),
      etaMinutes: Math.floor(Math.random() * 15) + 5,
      message: `Taxi booked to ${location}, arriving in approx ${Math.floor(Math.random() * 15) + 5} minutes.`,
    };

    res.json({ location, coordinates: { lat, lon }, hotels, weather, taxiBooking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// For any other route, serve index.html (for React Router support if needed)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
