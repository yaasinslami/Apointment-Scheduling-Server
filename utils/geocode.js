const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const geocodeCity = async (city) => {
    const apiKey = process.env.OPENCAGE_API_KEY;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data;

        if (data && data.results.length > 0) {
            const location = data.results[0].geometry;
            return [location.lng, location.lat];
        } else {
            console.error('No results found for the city.');
            return null;
        }
    } catch (error) {
        console.error('Error using OpenCage Geocoder API:', error);
        return null;
    }
};

module.exports = { geocodeCity };
