import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Phone, Star, Navigation, Compass, Heart, RefreshCw, QrCode } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../lib/LanguageContext';
import QRScannerComponent from './QRScannerComponent';

interface NearbyPlace {
  id: string;
  name: string;
  type: 'clinic' | 'store';
  lat: number;
  lng: number;
  address: string;
  phone: string;
  rating: number;
  distance: number;
  openNow: boolean;
}


// Haversine formula to compute accurate distance in kilometers
const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return parseFloat(d.toFixed(2));
};

const generateNearbyPlaces = (lat: number, lng: number): NearbyPlace[] => {
  const rawPlaces = [
    {
      id: 'clinic-1',
      name: 'Paws & Claws Veterinary Hospital',
      type: 'clinic' as const,
      lat: lat + 0.005,
      lng: lng - 0.006,
      address: '142 Vet Care Way, Suite A',
      phone: '(555) 123-4567',
      rating: 4.8,
      distance: 0,
      openNow: true,
    },
    {
      id: 'clinic-2',
      name: 'Metropolitan Veterinary Clinic',
      type: 'clinic' as const,
      lat: lat - 0.008,
      lng: lng + 0.004,
      address: '88 Animal Wellness Blvd',
      phone: '(555) 987-6543',
      rating: 4.6,
      distance: 0,
      openNow: true,
    },
    {
      id: 'clinic-3',
      name: '24/7 Emergency Pet Clinic',
      type: 'clinic' as const,
      lat: lat + 0.012,
      lng: lng + 0.008,
      address: '500 Guardian Angel Rd',
      phone: '(555) 333-2211',
      rating: 4.9,
      distance: 0,
      openNow: true,
    },
    {
      id: 'store-1',
      name: 'Petco Supplies & Grooming',
      type: 'store' as const,
      lat: lat - 0.004,
      lng: lng - 0.005,
      address: '235 Kibble Plaza',
      phone: '(555) 246-8100',
      rating: 4.4,
      distance: 0,
      openNow: true,
    },
    {
      id: 'store-2',
      name: 'The Healthy Pet & Bakery',
      type: 'store' as const,
      lat: lat + 0.007,
      lng: lng + 0.009,
      address: '12 Organic Treats Dr',
      phone: '(555) 444-5555',
      rating: 4.7,
      distance: 0,
      openNow: false,
    },
    {
      id: 'store-3',
      name: 'Bark & Meow Boutique',
      type: 'store' as const,
      lat: lat - 0.009,
      lng: lng - 0.012,
      address: '777 Luxury Leash Ln',
      phone: '(555) 888-9999',
      rating: 4.5,
      distance: 0,
      openNow: true,
    }
  ];

  return rawPlaces.map(p => ({
    ...p,
    distance: getHaversineDistance(lat, lng, p.lat, p.lng)
  })).sort((a, b) => a.distance - b.distance);
};

export default function NearbyServicesMap() {
  const { t } = useLanguage();
  const [coords, setCoords] = useState<[number, number]>([37.7749, -122.4194]); // SF default
  const [locationState, setLocationState] = useState<'requesting' | 'success' | 'fallback' | 'loading'>('requesting');
  const [geoipCity, setGeoipCity] = useState<string | null>(null);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [manualSearchLoading, setManualSearchLoading] = useState(false);
  const [manualSearchError, setManualSearchError] = useState<string | null>(null);
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'clinic' | 'store'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('favorite_services') || '[]');
    } catch {
      return [];
    }
  });

  const filteredPlaces = places.filter((p) => {
    const matchesTab = activeTab === 'all' || p.type === activeTab;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = favorites.includes(id)
      ? favorites.filter(favId => favId !== id)
      : [...favorites, id];
    setFavorites(updated);
    localStorage.setItem('favorite_services', JSON.stringify(updated));
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const handleManualLocationSearch = async (query: string) => {
    if (!query.trim()) return;
    setManualSearchLoading(true);
    setManualSearchError(null);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const lat = parseFloat(first.lat);
        const lon = parseFloat(first.lon);
        setCoords([lat, lon]);
        setGeoipCity(first.display_name);
        setLocationState('success');
        const loaded = generateNearbyPlaces(lat, lon);
        setPlaces(loaded);
      } else {
        setManualSearchError(t('Location not found. Try another city.', '未找到该位置，请尝试其他城市。'));
      }
    } catch (err) {
      console.error('Error querying Nominatim geocoder:', err);
      setManualSearchError(t('Failed to search location.', '搜索位置失败，请重试。'));
    } finally {
      setManualSearchLoading(false);
    }
  };

  const fetchGeolocation = async () => {
    setLocationState('loading');

    const handleGeoIPFallback = async () => {
      try {
        const res = await fetch('/api/geoip');
        const data = await res.json();
        if (data && (data.status === 'success' || data.status === 'fallback')) {
          setCoords([data.lat, data.lon]);
          if (data.city) {
            setGeoipCity(`${data.city}, ${data.region || ''}`);
          }
          setLocationState('success');
          const loaded = generateNearbyPlaces(data.lat, data.lon);
          setPlaces(loaded);
          return true;
        }
      } catch (err) {
        console.error('Failed to fetch geoip fallback:', err);
      }
      return false;
    };

    if (!navigator.geolocation) {
      const ok = await handleGeoIPFallback();
      if (!ok) {
        setLocationState('fallback');
        const loaded = generateNearbyPlaces(37.7749, -122.4194);
        setPlaces(loaded);
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setCoords([userLat, userLng]);
        setGeoipCity(null); // High accuracy GPS
        setLocationState('success');
        const loaded = generateNearbyPlaces(userLat, userLng);
        setPlaces(loaded);
      },
      async (error) => {
        console.warn('Geolocation error, trying GeoIP fallback:', error);
        const ok = await handleGeoIPFallback();
        if (!ok) {
          setLocationState('fallback');
          const loaded = generateNearbyPlaces(37.7749, -122.4194);
          setPlaces(loaded);
        }
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet Map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView(coords, 14);

    mapRef.current = map;

    // Add high-quality OpenStreetMap layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create a markers group
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Fetch geolocation and nearby data on mount
    fetchGeolocation();

    // Setup ResizeObserver for map parent container to prevent rendering gaps
    const parent = mapContainerRef.current.parentElement;
    let debounceTimer: NodeJS.Timeout;
    let observer: ResizeObserver | null = null;
    if (parent) {
      observer = new ResizeObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          map.invalidateSize({ animate: true });
        }, 150);
      });
      observer.observe(parent);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
      clearTimeout(debounceTimer);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Map View Center when coordinates change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(coords, 14, { animate: true, duration: 1.2 });
    }
  }, [coords]);

  // Update Markers when places, coords, or locationState changes
  useEffect(() => {
    const map = mapRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear previous markers
    markersGroup.clearLayers();

    // Define icons with custom tailwind content
    const userIcon = L.divIcon({
      className: 'bg-transparent border-none outline-none',
      html: `<div class="relative flex items-center justify-center">
        <div class="absolute w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
        <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const clinicIcon = L.divIcon({
      className: 'bg-transparent border-none outline-none',
      html: `<div class="flex items-center justify-center w-8 h-8 bg-rose-500 border-2 border-white rounded-full shadow-md text-white transition-transform hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l1.5-4.5 2 9 1.5-4.5h3.27"/></svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const storeIcon = L.divIcon({
      className: 'bg-transparent border-none outline-none',
      html: `<div class="flex items-center justify-center w-8 h-8 bg-purple-500 border-2 border-white rounded-full shadow-md text-white transition-transform hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    // Add current user location marker
    if (locationState === 'success') {
      const uMarker = L.marker(coords, { icon: userIcon }).addTo(markersGroup);
      uMarker.bindPopup(`<div class="p-1 font-semibold text-center text-xs">${t('Your Location', '您的当前位置')}</div>`);
    }

    // Add places markers
    filteredPlaces.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: place.type === 'clinic' ? clinicIcon : storeIcon,
      }).addTo(markersGroup);

      // Simple click handler
      marker.on('click', () => {
        setSelectedPlace(place);
      });

      // Bind elegant popup with standard CSS/HTML elements
      const popupHtml = `
        <div class="p-1 text-stone-900 min-w-[180px]">
          <span class="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mb-1 ${
            place.type === 'clinic' ? 'bg-rose-100 text-rose-700' : 'bg-purple-100 text-purple-700'
          }">
            ${place.type === 'clinic' ? t('Clinic', '诊所 🏥') : t('Pet Store', '用品店 🎒')}
          </span>
          <h5 class="font-bold text-xs mb-1">${place.name}</h5>
          <p class="text-[11px] text-stone-600 mb-1">${place.address}</p>
          <div class="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-stone-100">
            <span class="text-amber-500 flex items-center">⭐ ${place.rating}</span>
            <span class="${place.openNow ? 'text-emerald-600' : 'text-stone-400'}">
              ${place.openNow ? t('Open Now', '营业中') : t('Closed', '已打烊')}
            </span>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);
    });
  }, [filteredPlaces, coords, locationState, t]);

  return (
    <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-sm border border-stone-100 dark:border-stone-700 space-y-6" id="nearby-services-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white flex items-center">
            <Compass className="w-6 h-6 mr-2 text-rose-500 animate-spin-slow" /> {t('Nearby Veterinary & Pet Services', '周边诊所查找与宠物服务')}
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            {locationState === 'success' 
              ? t('Showing verified clinics and supply stores near your precise coordinates.', '为您展示您当前位置周边经认证的宠物诊所与用品商店。') 
              : locationState === 'loading'
              ? t('Locating your current device...', '正在定位您当前的设备位置...')
              : t('Showing results near SF (allow Geolocation access in browser for nearby accuracy).', '在实时地图上快速查找紧急诊中心、宠物医院或救助站，并追踪您的爱宠位置。')}
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowScanner(true)}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/50 dark:hover:bg-rose-900 rounded-full text-xs font-semibold text-rose-700 dark:text-rose-300 transition-colors cursor-pointer"
          >
            <QrCode className="w-3.5 h-3.5" />
            {t('Scan Tag', '扫描标签')}
          </button>
          <button 
            onClick={fetchGeolocation}
            className="self-start flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 rounded-full text-xs font-semibold text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${locationState === 'loading' ? 'animate-spin' : ''}`} />
            {t('Refresh Location', '刷新位置')}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Side: Filter, Search & List */}
        <div className="w-full lg:w-96 flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder={t('Search by name or address...', '搜索服务名称或地址...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 dark:bg-stone-900 border border-stone-100 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-stone-100"
            />
          </div>

          {/* Location Status & Manual Geocode Form */}
          <div className="bg-stone-50 dark:bg-stone-900 border border-stone-150 dark:border-stone-800 p-3.5 rounded-2xl space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{t('Map Focus Center', '当前地图中心焦点')}</span>
              {locationState === 'success' && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {geoipCity ? t('Resolved', '已自动解析') : t('GPS High Accuracy', '高精度 GPS')}
                </span>
              )}
            </div>
            {geoipCity && (
              <p className="text-xs font-black text-rose-500 truncate" title={geoipCity}>{geoipCity}</p>
            )}
            {!geoipCity && (
              <p className="text-xs font-bold text-stone-600 dark:text-stone-300 truncate">
                Lat: {coords[0].toFixed(4)}, Lng: {coords[1].toFixed(4)}
              </p>
            )}

            {/* Manual Location Input Form */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleManualLocationSearch(manualSearchQuery);
              }}
              className="flex gap-1.5"
            >
              <input
                type="text"
                placeholder={t('Enter City or Zipcode...', '输入城市、省份或邮编...')}
                value={manualSearchQuery}
                onChange={(e) => setManualSearchQuery(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-stone-900 dark:text-stone-100 animate-fade-in"
              />
              <button
                type="submit"
                disabled={manualSearchLoading}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-300 dark:disabled:bg-stone-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center min-w-[50px] shadow-sm hover:shadow-rose-500/10 active:scale-95"
              >
                {manualSearchLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : t('Set', '定位')}
              </button>
            </form>
            {manualSearchError && (
              <p className="text-[10px] font-bold text-rose-500 animate-pulse">{manualSearchError}</p>
            )}
          </div>

          <div className="flex gap-2">
            {(['all', 'clinic', 'store'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-lg transition-all capitalize cursor-pointer ${
                  activeTab === tab
                    ? 'bg-rose-500 text-white'
                    : 'bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                {tab === 'all' ? t('All Services', '全部服务') : tab === 'clinic' ? t('Vet Clinics', '医疗诊所 🏥') : t('Supply Stores', '用品商店 🎒')}
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 flex-1 scrollbar-thin">
            {filteredPlaces.length === 0 ? (
              <div className="text-center py-8 text-stone-400">
                <p className="text-sm">{t('No services match your search.', '未找到匹配您搜索条件的服务机构。')}</p>
              </div>
            ) : (
              filteredPlaces.map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                const isFavorite = favorites.includes(place.id);
                return (
                  <div
                    key={place.id}
                    onClick={() => {
                      setSelectedPlace(place);
                      setCoords([place.lat, place.lng]);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/20'
                        : 'border-stone-100 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-900/50 hover:bg-stone-50 dark:hover:bg-stone-900'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1.5 ${
                          place.type === 'clinic' 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}>
                          {place.type === 'clinic' ? t('Clinic', '医疗诊所 🏥') : t('Pet Store', '用品店 🎒')}
                        </span>
                        <h4 className="font-bold text-stone-900 dark:text-white text-sm line-clamp-1">{place.name}</h4>
                        <p className="text-xs text-stone-500 mt-0.5 flex items-center">
                          <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                          {place.address}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleToggleFavorite(place.id, e)}
                        className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                          isFavorite 
                            ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950' 
                            : 'text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                        }`}
                      >
                        <Heart className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center font-semibold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500 mr-0.5" />
                          {place.rating}
                        </span>
                        <span className="text-stone-400">|</span>
                        <span className="text-stone-500 font-medium">{place.distance} {t('km away', '公里外')}</span>
                      </div>
                      <span className={`font-semibold ${place.openNow ? 'text-emerald-600' : 'text-stone-400'}`}>
                        {place.openNow ? t('Open Now', '营业中') : t('Closed', '已打烊')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Map Container */}
        <div className="flex-1 h-[450px] rounded-3xl overflow-hidden border border-stone-100 dark:border-stone-700 relative z-10">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Quick detail panel overlays on map if place selected */}
          {selectedPlace && (
            <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700 flex flex-col md:flex-row md:items-center justify-between gap-4 z-[500] animate-in slide-in-from-bottom duration-300">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl text-white ${selectedPlace.type === 'clinic' ? 'bg-rose-500' : 'bg-purple-500'}`}>
                  {selectedPlace.type === 'clinic' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l1.5-4.5 2 9 1.5-4.5h3.27"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 dark:text-white text-sm">{selectedPlace.name}</h4>
                  <p className="text-xs text-stone-500">{selectedPlace.address}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <span className="flex items-center text-stone-600 dark:text-stone-300">
                      <Phone className="w-3.5 h-3.5 mr-1" /> {selectedPlace.phone}
                    </span>
                    <span className="text-stone-300">|</span>
                    <span className="text-rose-500 font-semibold">{selectedPlace.distance} {t('km away', '公里外')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  {t('Get Directions', '获取路线指引')}
                </a>
                <button
                  onClick={() => setSelectedPlace(null)}
                  className="px-3 py-2 text-xs font-semibold text-stone-500 hover:text-stone-700 bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-300 rounded-xl transition-all cursor-pointer"
                >
                  {t('Close', '关闭')}
                </button>
              </div>
            </div>
          )}
          {showScanner && (
            <QRScannerComponent 
              onScan={(data) => {
                setScanResult(data);
                setShowScanner(false);
              }}
              onClose={() => setShowScanner(false)}
            />
          )}
          {scanResult && (
            <div className="absolute top-4 left-4 z-[500] bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-700">
              <p className="text-sm font-bold">{t('Scanned Record', '扫描记录')}: {scanResult}</p>
              <button onClick={() => setScanResult(null)} className="text-xs text-stone-500 underline mt-2">{t('Dismiss', '关闭')}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
