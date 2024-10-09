import classes from './Map.module.css';
import sendGeoPoint from './sendGeoPoint.json';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { useEffect, useState } from 'react';


function SetMapView({ coords }) {
    const map = useMapEvents({});

    useEffect(() => {
        if (coords.length) {
            const latLngs = coords.map(point => [point.latitude, point.longitude]);
            const bounds = L.latLngBounds(latLngs);
            map.fitBounds(bounds);
        }
    }, [coords, map]);
    return null;
}

function MapEventHandler({ filteredData, setHoveredPoint, setNearestBluePoint }) {
    function findNearestPoint(latlng, points) {
        let nearestPoint = null;
        let minDistance = Infinity;

        points.forEach((point) => {
            const distance = latlng.distanceTo([point.latitude, point.longitude]);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = point;
            }
        });

        return { 
            nearestPoint, 
            minDistance 
        };
    }

    useMapEvents({
        mousemove(e) {
            if (filteredData.length > 0) {
                const { nearestPoint, minDistance } = findNearestPoint(e.latlng, filteredData);
                if (minDistance < 40) {
                    setHoveredPoint(nearestPoint);
                    setNearestBluePoint(nearestPoint);
                } 
                else if (minDistance < 300) {
                    setHoveredPoint(null);
                    setNearestBluePoint(nearestPoint);
                } 
                else {
                    setHoveredPoint(null);
                    setNearestBluePoint(null);
                }
            }
        },
    });
    return null;
}

function CustomControl({ coords }) {
    const map = useMap();
    const handleReset = () => {
        if (coords.length) {
            const latLngs = coords.map(point => [point.latitude, point.longitude]);
            const bounds = L.latLngBounds(latLngs);
            map.fitBounds(bounds);
        }
    };

    useEffect(() => {
        const controlDiv = L.control({ position: 'topright' });

        controlDiv.onAdd = function () {
            const div = L.DomUtil.create('div', classes.customControl);
            const button = L.DomUtil.create('button', '', div);
            button.innerHTML = 'Сброс позиции';
            button.onclick = handleReset;
            return div;
        };

        controlDiv.addTo(map);

        return () => {
            map.removeControl(controlDiv);
        };
    }, [map, coords]);

    return null;
}

export default function Map() {
    const [filteredData, setFilteredData] = useState([]);
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [nearestBluePoint, setNearestBluePoint] = useState(null);
    const defaultZoom = 13;

    useEffect(() => {
        const filteredPoints = sendGeoPoint.filter(point => {
            return (
                point.valid === 0 &&
                Math.abs(point.latitude) > 1 &&
                Math.abs(point.longitude) > 1 &&
                point.satellitecount >= 3
            );
        });
        setFilteredData(filteredPoints);
    }, []);

    return (
        <div className={classes['container']}>
            <MapContainer 
                zoom={defaultZoom} 
                scrollWheelZoom={true}
                zoomControl={false}
                className={classes['map']}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {nearestBluePoint && (
                    <Marker
                        position={[nearestBluePoint.latitude, nearestBluePoint.longitude]}
                        icon={new L.DivIcon({
                            className: 'custom-marker-blue',
                            html: `<div style="background-color: blue; width: 10px; height: 10px; border-radius: 50%;"></div>`,
                        })}
                    />
                )}

                {hoveredPoint && (
                    <Marker
                        position={[hoveredPoint.latitude, hoveredPoint.longitude]}
                        icon={new L.DivIcon({
                            className: 'custom-marker-red',
                            html: `<div style="transform: rotate(${hoveredPoint.dir}deg); font-size: 5vw; color: red;">↑</div>`,
                        })}
                    >
                        <Popup>
                            <pre>{JSON.stringify(hoveredPoint, null, 2)}</pre>
                        </Popup>
                    </Marker>
                )}
                
                <SetMapView coords={filteredData} />
                <Polyline positions={filteredData.map(point => [point.latitude, point.longitude])} color="blue" />
                <CustomControl coords={filteredData} />
                <MapEventHandler 
                    filteredData={filteredData} 
                    setHoveredPoint={setHoveredPoint} 
                    setNearestBluePoint={setNearestBluePoint}
                />
            </MapContainer>
        </div>
    );
}