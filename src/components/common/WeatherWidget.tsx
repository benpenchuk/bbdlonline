import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer, Eye } from 'lucide-react';

interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
  visibility: number;
  icon: string;
  feelsLike: number;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        
        // Using OpenWeatherMap API for Elon, NC
        // Free tier allows 1000 calls/day - more than enough for development
        // Get your free API key from: https://openweathermap.org/api
        // Then create a .env.local file with: REACT_APP_WEATHER_API_KEY=your_key_here
        const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'demo_key';
        const CITY = 'Elon,NC,US';
        
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=imperial`
          );
          
          if (!response.ok) {
            throw new Error('Weather API request failed');
          }
          
          const data = await response.json();
          
          const weatherData: WeatherData = {
            temperature: Math.round(data.main.temp),
            description: data.weather[0].description.split(' ').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind?.speed || 0),
            visibility: Math.round((data.visibility || 10000) / 1609.34), // Convert meters to miles
            icon: data.weather[0].icon,
            feelsLike: Math.round(data.main.feels_like)
          };
          
          setWeather(weatherData);
        } catch (apiError) {
          // Fallback to mock data if API fails (for demo purposes)
          console.warn('Weather API failed, using mock data:', apiError);
          
          const mockWeather: WeatherData = {
            temperature: Math.floor(Math.random() * 30) + 50,
            description: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 40) + 40,
            windSpeed: Math.floor(Math.random() * 15) + 3,
            visibility: Math.floor(Math.random() * 5) + 5,
            icon: 'sunny',
            feelsLike: Math.floor(Math.random() * 30) + 50
          };
          
          setWeather(mockWeather);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load weather data');
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh weather data every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('rain')) return <CloudRain size={24} />;
    if (desc.includes('snow')) return <CloudSnow size={24} />;
    if (desc.includes('cloud')) return <Cloud size={24} />;
    return <Sun size={24} />;
  };

  const getWeatherColor = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('rain')) return 'weather-rainy';
    if (desc.includes('snow')) return 'weather-snowy';
    if (desc.includes('cloud')) return 'weather-cloudy';
    return 'weather-sunny';
  };

  if (loading) {
    return (
      <div className="weather-widget weather-loading">
        <div className="weather-header">
          <h3>Weather in Elon, NC</h3>
        </div>
        <div className="weather-loading-spinner">
          <div className="spinner"></div>
          <span>Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="weather-widget weather-error">
        <div className="weather-header">
          <h3>Weather in Elon, NC</h3>
        </div>
        <div className="weather-error-message">
          <span>Weather data unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`weather-widget ${getWeatherColor(weather.description)}`}>
      <div className="weather-header">
        <h3>Weather in Elon, NC</h3>
        <span className="weather-location">27244</span>
      </div>

      <div className="weather-main">
        <div className="weather-icon">
          {getWeatherIcon(weather.description)}
        </div>
        <div className="weather-temp">
          <span className="temp-value">{weather.temperature}°</span>
          <span className="temp-unit">F</span>
        </div>
        <div className="weather-desc">{weather.description}</div>
      </div>

      <div className="weather-details">
        <div className="weather-detail">
          <Thermometer size={14} />
          <span className="detail-label">Feels like</span>
          <span className="detail-value">{weather.feelsLike}°F</span>
        </div>
        
        <div className="weather-detail">
          <Wind size={14} />
          <span className="detail-label">Wind</span>
          <span className="detail-value">{weather.windSpeed} mph</span>
        </div>
        
        <div className="weather-detail">
          <Eye size={14} />
          <span className="detail-label">Visibility</span>
          <span className="detail-value">{weather.visibility} mi</span>
        </div>
      </div>

      <div className="weather-game-impact">
        {weather.description.toLowerCase().includes('rain') ? (
          <span className="impact-warning">⚠️ May affect outdoor games</span>
        ) : weather.temperature < 40 ? (
          <span className="impact-warning">❄️ Cold weather - dress warm!</span>
        ) : weather.temperature > 85 ? (
          <span className="impact-warning">☀️ Hot weather - stay hydrated!</span>
        ) : (
          <span className="impact-good">✅ Great weather for games!</span>
        )}
      </div>
    </div>
  );
};

export default WeatherWidget;
