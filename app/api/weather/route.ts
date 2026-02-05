import { NextRequest, NextResponse } from 'next/server'

/**
 * Weather API Route
 * Fetches weather data for game locations using OpenWeatherMap API
 * Free tier allows 1000 calls/day
 */

// Stadium locations for major sports teams
const STADIUM_LOCATIONS: Record<string, { lat: number; lon: number; city: string }> = {
  // NFL
  'Seattle Seahawks': { lat: 47.5952, lon: -122.3316, city: 'Seattle' },
  'Atlanta Falcons': { lat: 33.7554, lon: -84.4008, city: 'Atlanta' },
  'Pittsburgh Steelers': { lat: 40.4468, lon: -80.0158, city: 'Pittsburgh' },
  'Baltimore Ravens': { lat: 39.2780, lon: -76.6227, city: 'Baltimore' },
  'Cincinnati Bengals': { lat: 39.0954, lon: -84.5160, city: 'Cincinnati' },
  'Buffalo Bills': { lat: 42.7738, lon: -78.7870, city: 'Buffalo' },
  'Tennessee Titans': { lat: 36.1665, lon: -86.7713, city: 'Nashville' },
  'Cleveland Browns': { lat: 41.5061, lon: -81.6995, city: 'Cleveland' },
  'Kansas City Chiefs': { lat: 39.0489, lon: -94.4839, city: 'Kansas City' },
  'Las Vegas Raiders': { lat: 36.0909, lon: -115.1833, city: 'Las Vegas' },
  'Los Angeles Chargers': { lat: 33.9534, lon: -118.3390, city: 'Los Angeles' },
  'Denver Broncos': { lat: 39.7439, lon: -105.0201, city: 'Denver' },
  'New England Patriots': { lat: 42.0909, lon: -71.2643, city: 'Foxborough' },
  'Miami Dolphins': { lat: 25.9580, lon: -80.2389, city: 'Miami' },
  'New York Jets': { lat: 40.8135, lon: -74.0745, city: 'East Rutherford' },
  'New York Giants': { lat: 40.8135, lon: -74.0745, city: 'East Rutherford' },
  'Philadelphia Eagles': { lat: 39.9008, lon: -75.1675, city: 'Philadelphia' },
  'Washington Commanders': { lat: 38.9076, lon: -76.8645, city: 'Landover' },
  'Dallas Cowboys': { lat: 32.7473, lon: -97.0945, city: 'Arlington' },
  'Green Bay Packers': { lat: 44.5013, lon: -88.0622, city: 'Green Bay' },
  'Chicago Bears': { lat: 41.8623, lon: -87.6167, city: 'Chicago' },
  'Detroit Lions': { lat: 42.3400, lon: -83.0456, city: 'Detroit' },
  'Minnesota Vikings': { lat: 44.9738, lon: -93.2577, city: 'Minneapolis' },
  'Tampa Bay Buccaneers': { lat: 27.9759, lon: -82.5033, city: 'Tampa' },
  'New Orleans Saints': { lat: 29.9511, lon: -90.0812, city: 'New Orleans' },
  'Carolina Panthers': { lat: 35.2258, lon: -80.8530, city: 'Charlotte' },
  'Arizona Cardinals': { lat: 33.5276, lon: -112.2626, city: 'Glendale' },
  'Los Angeles Rams': { lat: 33.9534, lon: -118.3390, city: 'Los Angeles' },
  'San Francisco 49ers': { lat: 37.4032, lon: -121.9698, city: 'Santa Clara' },
  'Jacksonville Jaguars': { lat: 30.3240, lon: -81.6373, city: 'Jacksonville' },
  'Houston Texans': { lat: 29.6847, lon: -95.4107, city: 'Houston' },
  'Indianapolis Colts': { lat: 39.7601, lon: -86.1639, city: 'Indianapolis' },

  // NBA - Major arenas
  'Los Angeles Lakers': { lat: 34.0430, lon: -118.2673, city: 'Los Angeles' },
  'Boston Celtics': { lat: 42.3662, lon: -71.0621, city: 'Boston' },
  'Golden State Warriors': { lat: 37.7680, lon: -122.3878, city: 'San Francisco' },
  'Miami Heat': { lat: 25.7814, lon: -80.1870, city: 'Miami' },

  // MLB - Major stadiums
  'New York Yankees': { lat: 40.8296, lon: -73.9262, city: 'Bronx' },
  'Los Angeles Dodgers': { lat: 34.0739, lon: -118.2400, city: 'Los Angeles' },
  'Boston Red Sox': { lat: 42.3467, lon: -71.0972, city: 'Boston' },

  // NHL - Major arenas
  'Toronto Maple Leafs': { lat: 43.6435, lon: -79.3791, city: 'Toronto' },
  'Montreal Canadiens': { lat: 45.4961, lon: -73.5693, city: 'Montreal' },
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const homeTeam = searchParams.get('homeTeam')
    const gameTime = searchParams.get('gameTime')

    if (!homeTeam || !gameTime) {
      return NextResponse.json(
        { error: 'Missing required parameters: homeTeam and gameTime' },
        { status: 400 }
      )
    }

    // Check if game is within next 4 days
    const gameDate = new Date(gameTime)
    const now = new Date()
    const fourDaysFromNow = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)

    if (gameDate > fourDaysFromNow) {
      return NextResponse.json({
        available: false,
        message: 'Weather forecast only available for games within 4 days'
      })
    }

    // Get stadium location
    const location = STADIUM_LOCATIONS[homeTeam]
    if (!location) {
      return NextResponse.json({
        available: false,
        message: 'Stadium location not found'
      })
    }

    // Use OpenWeatherMap API (free tier)
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        available: false,
        message: 'Weather API not configured. Please add OPENWEATHER_API_KEY to environment variables.'
      }, { status: 503 })
    }

    // Fetch real weather data
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}&units=imperial`
    const response = await fetch(weatherUrl)

    if (!response.ok) {
      throw new Error('Weather API request failed')
    }

    const weatherData = await response.json()

    // Find forecast closest to game time
    const forecasts = weatherData.list || []
    const gameForecast = forecasts.find((f: any) => {
      const forecastTime = new Date(f.dt * 1000)
      return Math.abs(forecastTime.getTime() - gameDate.getTime()) < 3 * 60 * 60 * 1000 // Within 3 hours
    }) || forecasts[0]

    if (!gameForecast) {
      return NextResponse.json({
        available: false,
        message: 'No forecast data available for game time'
      })
    }

    const temp = Math.round(gameForecast.main.temp)
    const windSpeed = Math.round(gameForecast.wind.speed)
    const condition = gameForecast.weather[0].main
    const humidity = gameForecast.main.humidity
    const precipitation = (gameForecast.pop || 0) * 100

    // Determine impact level
    let impactLevel = 'low'
    let impactDescription = 'Weather conditions should have minimal impact on gameplay'

    if (windSpeed > 15 || precipitation > 50 || temp < 32 || temp > 95) {
      impactLevel = 'high'
      if (windSpeed > 15) {
        impactDescription = `High winds (${windSpeed} mph) may affect passing game and field goals`
      } else if (precipitation > 50) {
        impactDescription = `High chance of rain (${Math.round(precipitation)}%) may lead to lower scoring`
      } else if (temp < 32) {
        impactDescription = `Freezing temperatures (${temp}°F) may impact ball handling and scoring`
      } else {
        impactDescription = `Extreme heat (${temp}°F) may affect player stamina and performance`
      }
    } else if (windSpeed > 10 || precipitation > 30 || temp < 40 || temp > 85) {
      impactLevel = 'moderate'
      impactDescription = 'Weather conditions may have some impact on gameplay and scoring'
    }

    return NextResponse.json({
      available: true,
      location: location.city,
      forecast: {
        temp,
        condition,
        windSpeed,
        humidity,
        precipitation: Math.round(precipitation),
      },
      impact: {
        level: impactLevel,
        description: impactDescription
      }
    })

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
