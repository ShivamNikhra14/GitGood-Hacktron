
import { Incident } from '../types';
import { Feature, FeatureCollection, Point } from 'geojson';

// Sample data for testing the map and heatmap visualization
export const sampleIncidents: Incident[] = [
  {
    id: '1',
    latitude: 24.4359,
    longitude:  77.1589,
    timestamp: '2023-04-15T14:30:00Z',
    category: 'verbal_harassment',
    severity: 'medium',
    description: 'Individual was verbally harassed while waiting for public transportation.',
    location_description: 'Near downtown transit station'
  },
  {
    id: '2',
    latitude: 24.4364,
    longitude:  77.1600,
    timestamp: '2023-04-16T18:45:00Z',
    category: 'discrimination',
    severity: 'high',
    description: 'Discriminatory comments were made by staff at a local business.',
    location_description: 'Coffee shop on Main Street'
  },
  {
    id: '3',
    latitude: 24.4384,
    longitude:  77.1782,
    timestamp: '2023-04-10T12:15:00Z',
    category: 'stalking',
    severity: 'high',
    description: 'Individual was followed for several blocks by an unknown person.',
    location_description: 'Along Riverwalk path'
  },
  {
    id: '4',
    latitude: 24.4354,
    longitude:  77.1581,
    timestamp: '2023-04-18T20:30:00Z',
    category: 'physical_harassment',
    severity: 'critical',
    description: 'Person was grabbed by a stranger while walking home.',
    location_description: 'Corner of Oak and Pine Street'
  },
  {
    id: '5',
    latitude: 24.4354,
    longitude:  77.1581,
    timestamp: '2023-04-14T13:00:00Z',
    category: 'online_harassment',
    severity: 'medium',
    description: 'Received threatening messages related to a local community event.',
    location_description: 'Community center area'
  },
  {
    id: '6',
    latitude: 24.4354,
    longitude:  77.1581,
    timestamp: '2023-04-17T15:20:00Z',
    category: 'bullying',
    severity: 'medium',
    description: 'Student reported repeated intimidation by peers.',
    location_description: 'Near university campus'
  },
  {
    id: '7',
    latitude: 24.4354,
    longitude:  77.1581,
    timestamp: '2023-04-13T19:45:00Z',
    category: 'discrimination',
    severity: 'high',
    description: 'Individual denied service based on perceived identity.',
    location_description: 'Local retail store'
  },
  {
    id: '8',
    latitude: 24.4354,
    longitude:  77.1581,
    timestamp: '2023-04-19T22:10:00Z',
    category: 'verbal_harassment',
    severity: 'low',
    description: 'Derogatory comments made by passerby.',
    location_description: 'Public park'
  }
];

export const generateHeatmapData = (incidents: Incident[]): FeatureCollection<Point> => {
  return {
    type: "FeatureCollection" as const,
    features: incidents.map(incident => ({
      type: "Feature" as const,
      properties: {
        intensity: 
          incident.severity === 'low' ? 0.3 :
          incident.severity === 'medium' ? 0.5 :
          incident.severity === 'high' ? 0.8 : 1
      },
      geometry: {
        type: "Point" as const,
        coordinates: [incident.longitude, incident.latitude]
      }
    }))
  };
};
