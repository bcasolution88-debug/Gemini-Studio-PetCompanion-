import React, { useState, useEffect, useRef, useMemo } from 'react';
import { QrReader } from 'react-qr-reader';
import { 
  MapPin, Battery, Wifi, AlertTriangle, Volume2, Lightbulb, 
  Plus, Compass, History, Bell, Play, Square, Settings, 
  CheckCircle, RefreshCw, Sliders, Eye, ShieldAlert, ShieldCheck, Info, QrCode, X, 
  Phone, Stethoscope, Edit3, Save
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../lib/LanguageContext';

interface TrackerPet {
  id: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Bird' | 'Other';
  breed: string;
  imageUrl: string;
  battery: number;
  signal: 'Excellent' | 'Good' | 'Fair' | 'None';
  status: 'Safe' | 'Roaming' | 'Escaped';
  lat: number;
  lng: number;
  lastUpdated: string;
  collarLight: boolean;
  geofenceRadius: number; // in meters
  homeLat: number;
  homeLng: number;
  breadcrumbs: [number, number][];
}

interface EventLog {
  id: string;
  timestamp: string;
  petName: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  message: string;
}

// Haversine formula to compute accurate distance in meters
const getDistanceInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return Math.round(R * c);
};

export default function PetTracker() {
  const { t } = useLanguage();
  const [userCoords, setUserCoords] = useState<[number, number]>([37.7749, -122.4194]); // SF defaults
  const [activePetId, setActivePetId] = useState<string>('buddy-1');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [logs, setLogs] = useState<EventLog[]>([
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 300000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      petName: 'Buddy',
      type: 'success',
      message: 'GPS Lock established. Safe zone active.'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 120000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      petName: 'Luna',
      type: 'info',
      message: 'Device collar paired on Channel 4.'
    }
  ]);

  // Initial list of tracked pets
  const [trackedPets, setTrackedPets] = useState<TrackerPet[]>([
    {
      id: 'buddy-1',
      name: 'Buddy',
      species: 'Dog',
      breed: 'Golden Retriever',
      imageUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=150',
      battery: 88,
      signal: 'Excellent',
      status: 'Safe',
      lat: 37.7758,
      lng: -122.4210,
      lastUpdated: 'Just now',
      collarLight: false,
      geofenceRadius: 150,
      homeLat: 37.7749,
      homeLng: -122.4194,
      breadcrumbs: [[37.7749, -122.4194], [37.7752, -122.4201]]
    },
    {
      id: 'luna-2',
      name: 'Luna',
      species: 'Cat',
      breed: 'Siamese',
      imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=150',
      battery: 42,
      signal: 'Good',
      status: 'Roaming',
      lat: 37.7738,
      lng: -122.4180,
      lastUpdated: '2m ago',
      collarLight: true,
      geofenceRadius: 100,
      homeLat: 37.7749,
      homeLng: -122.4194,
      breadcrumbs: [[37.7749, -122.4194], [37.7742, -122.4188]]
    },
    {
      id: 'charlie-3',
      name: 'Charlie',
      species: 'Dog',
      breed: 'Beagle',
      imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=150',
      battery: 15,
      signal: 'Fair',
      status: 'Escaped',
      lat: 37.7712,
      lng: -122.4250,
      lastUpdated: '1m ago',
      collarLight: false,
      geofenceRadius: 120,
      homeLat: 37.7749,
      homeLng: -122.4194,
      breadcrumbs: [[37.7749, -122.4194], [37.7731, -122.4212], [37.7720, -122.4231]]
    }
  ]);

  // Form states for new collar registration
  const [showAddForm, setShowAddForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [newCollar, setNewCollar] = useState({
    name: '',
    species: 'Dog' as 'Dog' | 'Cat' | 'Bird' | 'Other',
    breed: '',
    collarId: '',
    radius: 100,
    imageUrl: 'https://images.unsplash.com/photo-1444212477490-ca407925329e?auto=format&fit=crop&q=80&w=150'
  });

  const activePet = useMemo(() => {
    return trackedPets.find(p => p.id === activePetId) || trackedPets[0];
  }, [trackedPets, activePetId]);

  // Leaflet references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const petMarkerRef = useRef<L.Marker | null>(null);
  const geofenceCircleRef = useRef<L.Circle | null>(null);
  const breadcrumbsPolylineRef = useRef<L.Polyline | null>(null);

  // sound trigger state (temporary visual trigger)
  const [isCollarRinging, setIsCollarRinging] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState({
    vet: { name: '', phone: '' },
    clinic: { name: '', phone: '' }
  });
  const [isEditingContacts, setIsEditingContacts] = useState(false);

  // Fetch true geolocation to offset tracked pets around the user
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setUserCoords([lat, lng]);

          // Reposition home bases and pet initial coords relative to the user coordinates
          setTrackedPets(prev => prev.map((p, i) => {
            const offsetLat = i === 0 ? 0.0009 : i === 1 ? -0.0011 : -0.0037;
            const offsetLng = i === 0 ? -0.0016 : i === 1 ? 0.0014 : -0.0056;
            const petLat = lat + offsetLat;
            const petLng = lng + offsetLng;

            return {
              ...p,
              homeLat: lat,
              homeLng: lng,
              lat: petLat,
              lng: petLng,
              breadcrumbs: [[lat, lng], [lat + offsetLat * 0.4, lng + offsetLng * 0.4], [petLat, petLng]]
            };
          }));

          addLogEntry('System', 'info', `Device coordinates recalibrated to your browser physical location.`);
        },
        (err) => {
          console.warn("Using fallback coordinates:", err);
        }
      );
    }
    const saved = localStorage.getItem('emergency_contacts');
    if (saved) setEmergencyContacts(JSON.parse(saved));
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Map
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
    }).setView([activePet.lat, activePet.lng], 15);

    mapRef.current = map;

    // Add Tile Layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create layers
    geofenceCircleRef.current = L.circle([activePet.homeLat, activePet.homeLng], {
      radius: activePet.geofenceRadius,
      color: '#ec4899',
      fillColor: '#ec4899',
      fillOpacity: 0.1,
      dashArray: '5, 5'
    }).addTo(map);

    breadcrumbsPolylineRef.current = L.polyline(activePet.breadcrumbs, {
      color: '#6366f1',
      weight: 3,
      opacity: 0.7,
      dashArray: '3, 6'
    }).addTo(map);

    // Define Custom Div Icons for elegant look
    const petIcon = L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-12 h-12 rounded-full bg-indigo-500/30 animate-pulse"></div>
          <div class="relative w-9 h-9 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white">
            <img src="${activePet.imageUrl}" class="w-full h-full object-cover" />
          </div>
          <span class="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-white ${
            activePet.status === 'Safe' ? 'bg-emerald-500' : activePet.status === 'Roaming' ? 'bg-amber-500' : 'bg-red-500 animate-ping'
          }"></span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    const homeIcon = L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div class="flex items-center justify-center w-8 h-8 bg-pink-500 text-white rounded-full shadow-md border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    petMarkerRef.current = L.marker([activePet.lat, activePet.lng], { icon: petIcon }).addTo(map);
    userMarkerRef.current = L.marker([activePet.homeLat, activePet.homeLng], { icon: homeIcon }).addTo(map);

    // Popup binder
    petMarkerRef.current.bindPopup(`<div class="p-1 font-bold text-xs">${activePet.name} is currently ${activePet.status}</div>`);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update map state when active pet changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Center map
    map.setView([activePet.lat, activePet.lng], 15);

    // Update markers and circle positions
    if (geofenceCircleRef.current) {
      geofenceCircleRef.current.setLatLng([activePet.homeLat, activePet.homeLng]);
      geofenceCircleRef.current.setRadius(activePet.geofenceRadius);
      geofenceCircleRef.current.setStyle({
        color: activePet.status === 'Escaped' ? '#ef4444' : '#ec4899',
        fillColor: activePet.status === 'Escaped' ? '#ef4444' : '#ec4899'
      });
    }

    if (breadcrumbsPolylineRef.current) {
      breadcrumbsPolylineRef.current.setLatLngs(activePet.breadcrumbs);
    }

    if (petMarkerRef.current) {
      petMarkerRef.current.setLatLng([activePet.lat, activePet.lng]);
      const petIcon = L.divIcon({
        className: 'bg-transparent border-none',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-12 h-12 rounded-full bg-indigo-500/30 animate-pulse"></div>
            <div class="relative w-9 h-9 rounded-full border-2 border-white shadow-lg overflow-hidden bg-white">
              <img src="${activePet.imageUrl}" class="w-full h-full object-cover" />
            </div>
            <span class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
              activePet.status === 'Safe' ? 'bg-emerald-500' : activePet.status === 'Roaming' ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
            }"></span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
      petMarkerRef.current.setIcon(petIcon);
      const statusText = activePet.status === 'Safe' ? t('Safe', '安全中') : activePet.status === 'Roaming' ? t('Roaming', '自由活动') : t('Escaped', '超出围栏');
      const dist = getDistanceInMeters(activePet.lat, activePet.lng, activePet.homeLat, activePet.homeLng);
      petMarkerRef.current.setPopupContent(`<div class="p-1 font-bold text-xs">${activePet.name} ${t('is', '处于')} ${statusText} (${dist}${t('m from Home', '米外（家庭中心）')})</div>`);
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([activePet.homeLat, activePet.homeLng]);
    }
  }, [activePetId, trackedPets, t]);

  // Handle Event Logger entries
  const addLogEntry = (petName: string, type: 'info' | 'warning' | 'danger' | 'success', message: string) => {
    const newEntry: EventLog = {
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      petName,
      type,
      message
    };
    setLogs(prev => [newEntry, ...prev].slice(0, 50)); // limit 50 logs
  };

  // Movement Simulation Engine
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTrackedPets(prevPets => {
        return prevPets.map(pet => {
          // Add small coordinate fluctuations
          // Standard walk step offset is around 0.0003 coords
          const driftLat = (Math.random() - 0.5) * 0.0007;
          const driftLng = (Math.random() - 0.5) * 0.0007;
          
          let nextLat = pet.lat + driftLat;
          let nextLng = pet.lng + driftLng;

          // Occasionally snap back to home to avoid drifting infinitely away
          if (Math.random() < 0.05) {
            nextLat = pet.homeLat + (Math.random() - 0.5) * 0.001;
            nextLng = pet.homeLng + (Math.random() - 0.5) * 0.001;
          }

          const dist = getDistanceInMeters(nextLat, nextLng, pet.homeLat, pet.homeLng);
          
          let nextStatus: 'Safe' | 'Roaming' | 'Escaped' = 'Safe';
          if (dist > pet.geofenceRadius) {
            nextStatus = 'Escaped';
          } else if (dist > pet.geofenceRadius * 0.7) {
            nextStatus = 'Roaming';
          }

          // Trigger notifications/logs if state transitions
          if (nextStatus !== pet.status) {
            if (nextStatus === 'Escaped') {
              addLogEntry(pet.name, 'danger', `CRITICAL: Breached Geofence Boundary! Dist: ${dist}m, Safe Zone: ${pet.geofenceRadius}m.`);
            } else if (nextStatus === 'Roaming') {
              addLogEntry(pet.name, 'warning', `Warning: Pet is roaming near safe boundary. Dist: ${dist}m.`);
            } else {
              addLogEntry(pet.name, 'success', `Pet returned securely within Geofence Safe Zone.`);
            }
          }

          // Battery drainage simulation
          const batteryDrop = Math.random() < 0.15 ? 1 : 0;
          const nextBattery = Math.max(0, pet.battery - batteryDrop);

          if (nextBattery === 15 && pet.battery > 15) {
            addLogEntry(pet.name, 'warning', `Low collar battery detected (${nextBattery}%). Please recharge.`);
          }

          const updatedBreadcrumbs = [...pet.breadcrumbs, [nextLat, nextLng] as [number, number]].slice(-15);

          return {
            ...pet,
            lat: nextLat,
            lng: nextLng,
            status: nextStatus,
            battery: nextBattery,
            lastUpdated: 'Just now',
            breadcrumbs: updatedBreadcrumbs
          };
        });
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Sound ring trigger
  const handleRingCollar = () => {
    setIsCollarRinging(true);
    addLogEntry(activePet.name, 'success', `Audible ringing signal triggered on device channel. Beeping active.`);
    setTimeout(() => {
      setIsCollarRinging(false);
    }, 3000);
  };

  // Toggle night LED light on collar
  const handleToggleCollarLight = () => {
    setTrackedPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        const nextLight = !p.collarLight;
        addLogEntry(p.name, 'info', `Collar night-light LED ${nextLight ? 'ENABLED' : 'DISABLED'}.`);
        return { ...p, collarLight: nextLight };
      }
      return p;
    }));
  };

  // Broadcast Lost Alert
  const handleBroadcastLostAlert = () => {
    setTrackedPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        addLogEntry(p.name, 'danger', `BROADCASTING LOST ALERT to community! Location pin sent for ${p.name}.`);
        return { ...p, status: 'Escaped' };
      }
      return p;
    }));
  };

  const handleSaveContacts = () => {
    localStorage.setItem('emergency_contacts', JSON.stringify(emergencyContacts));
    setIsEditingContacts(false);
  };


  // Emergency SOS
  const handleEmergencySOS = () => {
    addLogEntry('System', 'danger', `!!! EMERGENCY SOS ACTIVATED !!! Alerting shelters and users in 5km radius for ${activePet.name}.`);
    // Simulated alert
  };

  // Force Manual location refresh
  const handleForcePing = () => {
    addLogEntry(activePet.name, 'info', `Manual query ping sent. Signal strength: ${activePet.signal}.`);
    setTrackedPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        return { ...p, lastUpdated: 'Just now' };
      }
      return p;
    }));
  };

  // Adjust Geofence safe zone radius
  const handleAdjustGeofence = (val: number) => {
    setTrackedPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        return { ...p, geofenceRadius: val };
      }
      return p;
    }));
  };

  // Set home base center
  const handleSetHomeBase = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      setTrackedPets(prev => prev.map(p => {
        if (p.id === activePetId) {
          addLogEntry(p.name, 'success', `New customized Home Base set at map viewport center: [${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}].`);
          return {
            ...p,
            homeLat: center.lat,
            homeLng: center.lng
          };
        }
        return p;
      }));
    }
  };

  // Register New Collar Form submission
  const handleRegisterCollar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollar.name || !newCollar.collarId) return;

    const randomizedOffsetLat = (Math.random() - 0.5) * 0.002;
    const randomizedOffsetLng = (Math.random() - 0.5) * 0.002;

    const freshPet: TrackerPet = {
      id: `collar-${Date.now()}`,
      name: newCollar.name,
      species: newCollar.species,
      breed: newCollar.breed || 'Unknown Breed',
      imageUrl: newCollar.imageUrl,
      battery: 100,
      signal: 'Excellent',
      status: 'Safe',
      lat: userCoords[0] + randomizedOffsetLat,
      lng: userCoords[1] + randomizedOffsetLng,
      lastUpdated: 'Just now',
      collarLight: false,
      geofenceRadius: Number(newCollar.radius),
      homeLat: userCoords[0],
      homeLng: userCoords[1],
      breadcrumbs: [[userCoords[0], userCoords[1]], [userCoords[0] + randomizedOffsetLat, userCoords[1] + randomizedOffsetLng]]
    };

    setTrackedPets(prev => [...prev, freshPet]);
    setActivePetId(freshPet.id);
    setShowAddForm(false);
    
    // reset form
    setNewCollar({
      name: '',
      species: 'Dog',
      breed: '',
      collarId: '',
      radius: 100,
      imageUrl: 'https://images.unsplash.com/photo-1444212477490-ca407925329e?auto=format&fit=crop&q=80&w=150'
    });

    addLogEntry(freshPet.name, 'success', `New tracker device paired successfully. Registered Serial: ${newCollar.collarId}.`);
  };

  const activeDistance = getDistanceInMeters(activePet.lat, activePet.lng, activePet.homeLat, activePet.homeLng);

  return (
    <div className="space-y-6">
      {/* Simulation status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/60 dark:border-indigo-900/40 rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSimulating ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isSimulating ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <div className="text-xs">
            <span className="font-bold text-stone-850 dark:text-stone-200">
              {isSimulating ? t('Active GPS Tracking Simulation', '实时 GPS 追踪模拟中') : t('GPS Tracker Paused', 'GPS 追踪已暂停')}
            </span>
            <p className="text-stone-500 dark:text-stone-400">{t('Pet coordinates are wandering around live collar nodes.', '宠物定位正在追踪器节点周边实时变动。')}</p>
          </div>
        </div>

        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            isSimulating 
              ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
          }`}
        >
          {isSimulating ? (
            <>
              <Square className="w-3.5 h-3.5" />
              <span>{t('Pause Simulation', '暂停模拟')}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>{t('Resume Simulation', '恢复模拟')}</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT COLUMN: Tracked Pets List */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm flex flex-col flex-1">
            <div className="flex items-center justify-between pb-3 border-b border-stone-50 dark:border-stone-800">
              <h3 className="font-black text-stone-900 dark:text-white text-xs uppercase tracking-wider">{t('Collars Attached', '已绑定追踪器')} ({trackedPets.length})</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowScanner(true)}
                  className="flex items-center gap-1 text-[11px] font-black text-rose-500 hover:text-rose-600 cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" /> {t('Scan', '扫码')}
                </button>
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1 text-[11px] font-black text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('Register', '注册绑定')}
                </button>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3 mt-3 overflow-y-auto max-h-[360px] flex-1">
              {trackedPets.map(pet => {
                const isActive = pet.id === activePetId;
                const distance = getDistanceInMeters(pet.lat, pet.lng, pet.homeLat, pet.homeLng);
                return (
                  <div
                    key={pet.id}
                    onClick={() => setActivePetId(pet.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                      isActive 
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20' 
                        : 'border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex gap-2.5 items-center">
                      <img 
                        src={pet.imageUrl} 
                        alt={pet.name} 
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-white"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-stone-900 dark:text-white text-xs truncate">{pet.name}</h4>
                          {/* Status badge */}
                          <span className={`inline-flex items-center gap-0.5 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            pet.status === 'Safe' 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : pet.status === 'Roaming'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 animate-pulse'
                          }`}>
                            {pet.status === 'Safe' ? t('Safe', '安全中') : pet.status === 'Roaming' ? t('Roaming', '自由活动') : t('Escaped', '超出范围')}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-400 truncate">{pet.breed}</p>
                      </div>
                    </div>

                    {/* Meta stats inside card */}
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-stone-100/55 dark:border-stone-800/80 text-[10px] text-stone-500">
                      <div className="flex items-center gap-1">
                        <Battery className={`w-3.5 h-3.5 ${pet.battery < 20 ? 'text-red-500 animate-pulse' : 'text-stone-400'}`} />
                        <span>{pet.battery}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5 text-stone-400" />
                        <span>{pet.signal === 'Excellent' ? t('Excellent', '极佳') : pet.signal === 'Good' ? t('Good', '良好') : pet.signal === 'Fair' ? t('Fair', '一般') : t('None', '无信号')}</span>
                      </div>
                      <span className="font-semibold text-stone-600 dark:text-stone-300">
                        {distance}{t('m', '米')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add device quick guide / pair form */}
          {showAddForm && (
            <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-md animate-fade-in space-y-3">
              <h4 className="text-xs font-black text-stone-900 dark:text-white flex items-center gap-1">
                <Settings className="w-4 h-4 text-indigo-500 animate-spin-slow" /> {t('Pair New Collar Tracker', '绑定新宠物追踪器')}
              </h4>
              <form onSubmit={handleRegisterCollar} className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-stone-400 block mb-1">{t('Pet Name', '宠物昵称')}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Buddy"
                    value={newCollar.name}
                    onChange={(e) => setNewCollar(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-stone-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block mb-1">{t('Species', '宠物种类')}</label>
                    <select
                      value={newCollar.species}
                      onChange={(e) => setNewCollar(prev => ({ ...prev, species: e.target.value as any }))}
                      className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-800 dark:text-stone-200"
                    >
                      <option value="Dog">{t('Dog', '狗狗 🐶')}</option>
                      <option value="Cat">{t('Cat', '猫咪 🐱')}</option>
                      <option value="Bird">{t('Bird', '鸟儿 🐦')}</option>
                      <option value="Other">{t('Other', '其他 🐾')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block mb-1">{t('Breed', '宠物品种')}</label>
                    <input 
                      type="text"
                      placeholder="Goldendoodle"
                      value={newCollar.breed}
                      onChange={(e) => setNewCollar(prev => ({ ...prev, breed: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block mb-1">{t('Tracker Serial ID', '追踪器序列号 ID')}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="TRK-882-GP"
                      value={newCollar.collarId}
                      onChange={(e) => setNewCollar(prev => ({ ...prev, collarId: e.target.value }))}
                      className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-400 block mb-1">{t('Safe Radius (m)', '安全围栏半径 (米)')}</label>
                    <input 
                      type="number" 
                      min="30"
                      max="1000"
                      required
                      value={newCollar.radius}
                      onChange={(e) => setNewCollar(prev => ({ ...prev, radius: Number(e.target.value) }))}
                      className="w-full px-2.5 py-1.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {t('Cancel', '取消')}
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {t('Bind Device', '确认绑定')}
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* QR Scanner Modal */}
          {showScanner && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-white dark:bg-stone-850 p-6 rounded-3xl shadow-2xl w-full max-w-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-stone-900 dark:text-white">{t('Scan Pet Tag', '扫描宠物标签')}</h3>
                  <button onClick={() => setShowScanner(false)}><X className="w-5 h-5" /></button>
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <QrReader
                    onResult={(result, error) => {
                      if (result) {
                        addLogEntry('System', 'success', `QR Scanned: ${result.getText()}`);
                        setShowScanner(false);
                      }
                    }}
                    constraints={{ facingMode: 'environment' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MIDDLE COLUMN: Interactive Map & Live Geofence Settings */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm flex flex-col">
            {/* Map Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-50 dark:border-stone-800 mb-3 text-xs">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                <span className="font-bold text-stone-900 dark:text-white">{t('Active Node', '当前追踪节点')}: {activePet.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleForcePing}
                  className="flex items-center gap-1 text-[11px] font-bold text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer"
                  title="Query collar node now"
                >
                  <RefreshCw className="w-3 h-3" /> {t('Ping GPS', '手动测距')}
                </button>
                <button
                  onClick={handleSetHomeBase}
                  className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                  title="Set geofence center to map focus center"
                >
                  <MapPin className="w-3 h-3" /> {t('Set Home Here', '设为家庭中心')}
                </button>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="h-[340px] w-full rounded-2xl overflow-hidden relative border border-stone-100 dark:border-stone-700 z-10">
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Float visual alerts directly over map */}
              {activePet.status === 'Escaped' && (
                <div className="absolute top-3 left-3 right-3 bg-red-500/95 text-white p-3 rounded-xl flex items-center gap-3 shadow-lg z-[401] animate-bounce">
                  <AlertTriangle className="w-5 h-5 animate-pulse shrink-0" />
                  <div className="text-xs">
                    <strong className="font-black uppercase tracking-wider block">{t('GEOFENCE BREACH ALERT', '宠物超出安全围栏警报！')}</strong>
                    <span>{activePet.name} {t('is out of geofence', '已离开家庭中心安全围栏，当前距离为')} {activeDistance} {t('meters away', '米！')}</span>
                  </div>
                </div>
              )}

              {/* Sound Ring Pulse Overlay */}
              {isCollarRinging && (
                <div className="absolute inset-0 bg-indigo-900/30 backdrop-blur-[1px] flex items-center justify-center z-[401] animate-fade-in">
                  <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-2xl border border-indigo-200 flex flex-col items-center gap-3 animate-scale-up text-center max-w-xs">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center animate-bounce">
                      <Volume2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-stone-900 dark:text-white">{t('Ringing collar', '正在呼叫宠物：')} {activePet.name}</h4>
                      <p className="text-[11px] text-stone-500">{t('Collar beep signal', '防丢追踪器正在发出高频蜂鸣声波以协助寻找。')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Hardware Controls & Geofencing Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Geofence Parameters Card */}
            <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                {activePet.status === 'Escaped' ? (
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                )}
                {t('Geofence Safe Zone', '地理安全围栏')}
              </h4>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-stone-500">{t('Radius Limit:', '围栏半径限制:')}</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">{activePet.geofenceRadius} {t('meters', '米')}</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="300"
                  step="10"
                  value={activePet.geofenceRadius}
                  onChange={(e) => handleAdjustGeofence(Number(e.target.value))}
                  className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>30m</span>
                  <span>150m</span>
                  <span>300m</span>
                </div>
              </div>

              <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-2xl border border-stone-100/50 dark:border-stone-800 flex justify-between items-center text-xs">
                <span className="text-stone-500">{t('Current Distance:', '当前距离家庭:')}</span>
                <span className={`font-black ${
                  activePet.status === 'Safe' ? 'text-emerald-600' : activePet.status === 'Roaming' ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {activeDistance} {t('meters', '米')}
                </span>
              </div>
            </div>

            {/* Hardware Commands Card */}
            <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-stone-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-500" />
                {t('Collar Commands', '追踪器硬件指令')}
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Ring command */}
                <button
                  type="button"
                  onClick={handleRingCollar}
                  disabled={isCollarRinging}
                  className="flex flex-col items-center justify-center p-3 rounded-2xl border border-stone-100 dark:border-stone-800/85 bg-stone-50/50 hover:bg-stone-100 dark:bg-stone-900/40 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer group"
                >
                  <Volume2 className="w-5 h-5 text-indigo-500 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">{t('Ring Beacon', '发出寻宠声波')}</span>
                  <span className="text-[8px] text-stone-400 font-medium">{t('Audible Sound', '追踪器发出蜂鸣')}</span>
                </button>

                {/* Night Light Toggle */}
                <button
                  type="button"
                  onClick={handleToggleCollarLight}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-colors cursor-pointer group ${
                    activePet.collarLight
                      ? 'border-indigo-200 bg-indigo-50/30 text-indigo-600 dark:border-indigo-900/40 dark:bg-indigo-950/20'
                      : 'border-stone-100 dark:border-stone-800/85 bg-stone-50/50 hover:bg-stone-100 dark:bg-stone-900/40 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <Lightbulb className={`w-5 h-5 mb-1.5 group-hover:scale-110 transition-transform ${activePet.collarLight ? 'text-amber-500 fill-amber-300' : 'text-stone-400'}`} />
                  <span className="text-[10px] font-bold">{t('Collar LED Light', '夜间 LED 寻宠灯')}</span>
                  <span className="text-[8px] text-stone-400 font-medium">{t('Night Visibility', '提升夜间能见度')}</span>
                </button>

                {/* Broadcast Lost Alert */}
                <button
                  type="button"
                  onClick={handleBroadcastLostAlert}
                  className="col-span-2 flex flex-col items-center justify-center p-3 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 text-red-600 transition-colors cursor-pointer group"
                >
                  <AlertTriangle className="w-5 h-5 text-red-500 mb-1.5 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold">{t('Broadcast Lost Alert', '广播丢失警报')}</span>
                  <span className="text-[8px] text-red-400 font-medium">{t('Community Alert', '发送定位到社区')}</span>
                </button>
                
                {/* Emergency SOS */}
                <button
                  type="button"
                  onClick={handleEmergencySOS}
                  className="col-span-2 flex flex-col items-center justify-center p-3 rounded-2xl border border-black bg-black hover:bg-stone-900 text-white transition-all cursor-pointer group animate-pulse"
                >
                  <AlertTriangle className="w-6 h-6 text-red-500 mb-1.5 animate-bounce" />
                  <span className="text-xs font-black uppercase">{t('Emergency SOS', '紧急求救')}</span>
                  <span className="text-[9px] text-red-300 font-bold">{t('Alert Shelters & Community', '警报动物救助站与周边社区')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Telemetry & Event Log */}
        <div className="lg:col-span-1 flex flex-col space-y-4">
          <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm flex flex-col flex-1 h-[320px] lg:h-auto overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-stone-50 dark:border-stone-800">
              <h3 className="font-black text-stone-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-rose-500" /> {t('Device Telemetry Logs', '追踪器日志监控')}
              </h3>
              <button
                onClick={() => {
                  setLogs([
                    {
                      id: 'clear-log',
                      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                      petName: 'System',
                      type: 'info',
                      message: t('Log cleared by user.', '日志已被用户清空。')
                    }
                  ]);
                }}
                className="text-[10px] font-bold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 cursor-pointer"
              >
                {t('Clear', '清空')}
              </button>
            </div>

            {/* Scrollable logs */}
            <div className="space-y-3 mt-3 overflow-y-auto flex-1 pr-1 font-mono text-[10px] max-h-[380px] scrollbar-thin">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <span>{t('Listening for device nodes...', '正在监听追踪器节点数据...')}</span>
                </div>
              ) : (
                logs.map(log => {
                  let badgeColor = 'bg-stone-100 text-stone-700 dark:bg-stone-800';
                  if (log.type === 'danger') badgeColor = 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-500/20';
                  if (log.type === 'warning') badgeColor = 'bg-amber-100 text-amber-750 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-500/20';
                  if (log.type === 'success') badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400';

                  return (
                    <div 
                      key={log.id} 
                      className={`p-2.5 rounded-xl border border-stone-100/50 dark:border-stone-800/80 space-y-1 ${
                        log.type === 'danger' ? 'bg-red-50/30 dark:bg-red-950/10' : 'bg-stone-50/30 dark:bg-stone-900/10'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[9px] text-stone-400">
                        <span className="font-semibold text-stone-500">{log.timestamp}</span>
                        <span className={`px-1.5 py-0.5 rounded-md font-bold uppercase ${badgeColor}`}>
                          {log.petName === 'System' ? t('System', '系统') : log.petName}
                        </span>
                      </div>
                      <p className="text-stone-600 dark:text-stone-300 leading-normal font-sans text-[11px]">
                        {log.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Informational bottom hint */}
            <div className="mt-3 pt-3 border-t border-stone-50 dark:border-stone-800 text-[10px] text-stone-400 font-sans flex gap-1.5 items-start">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
              <span>{t('Collar logs are updated real-time when the GPS locator completes high-frequency cellular triangulation cycles.', '当 GPS 追踪器完成高频蜂窝网络三角定位解算时，追踪器日志将进行实时同步与更新。')}</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-stone-850 p-4 rounded-3xl border border-stone-100 dark:border-stone-800/80 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-stone-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" /> {t('Emergency Contacts', '紧急联系方式')}
              </h3>
              <button onClick={() => isEditingContacts ? handleSaveContacts() : setIsEditingContacts(true)} className="text-indigo-600 hover:text-indigo-700">
                {isEditingContacts ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2 items-start">
                <Stethoscope className="w-4 h-4 text-stone-400 mt-1" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-stone-500">{t('Primary Vet', '兽医诊所')}</p>
                  {isEditingContacts ? (
                    <input className="w-full text-xs p-1 border rounded" value={emergencyContacts.vet.name} onChange={e => setEmergencyContacts(p => ({...p, vet: {...p.vet, name: e.target.value}}))} placeholder={t('Clinic Name', '诊所名称')} />
                  ) : <p className="text-xs">{emergencyContacts.vet.name || '-'}</p>}
                  {isEditingContacts ? (
                    <input className="w-full text-xs p-1 border rounded mt-1" value={emergencyContacts.vet.phone} onChange={e => setEmergencyContacts(p => ({...p, vet: {...p.vet, phone: e.target.value}}))} placeholder={t('Phone', '电话')} />
                  ) : <p className="text-xs text-stone-500">{emergencyContacts.vet.phone || '-'}</p>}
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <Phone className="w-4 h-4 text-stone-400 mt-1" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-stone-500">{t('Emergency Clinic', '急诊医院')}</p>
                  {isEditingContacts ? (
                    <input className="w-full text-xs p-1 border rounded" value={emergencyContacts.clinic.name} onChange={e => setEmergencyContacts(p => ({...p, clinic: {...p.clinic, name: e.target.value}}))} placeholder={t('Clinic Name', '医院名称')} />
                  ) : <p className="text-xs">{emergencyContacts.clinic.name || '-'}</p>}
                  {isEditingContacts ? (
                    <input className="w-full text-xs p-1 border rounded mt-1" value={emergencyContacts.clinic.phone} onChange={e => setEmergencyContacts(p => ({...p, clinic: {...p.clinic, phone: e.target.value}}))} placeholder={t('Phone', '电话')} />
                  ) : <p className="text-xs text-stone-500">{emergencyContacts.clinic.phone || '-'}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
