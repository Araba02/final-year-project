import { httpClient } from "./httpClient";
import { ENDPOINTS } from "./endpoints";

function mapPlace(dto) {
  return {
    id: dto.id,
    label: dto.label,
    address: dto.address,
    icon: dto.icon || "map-pin",
    lat: dto.lat ?? null,
    lng: dto.lng ?? null,
  };
}

export const savedPlacesService = {
  async list() {
    const { data } = await httpClient.get(ENDPOINTS.users.savedPlaces);
    return (data || []).map(mapPlace);
  },

  async add({ label, address, icon = "map-pin", lat = null, lng = null }) {
    const { data } = await httpClient.post(ENDPOINTS.users.savedPlaces, {
      id: null,
      label,
      address,
      icon,
      lat,
      lng,
    });
    return mapPlace(data);
  },

  async remove(placeId) {
    await httpClient.delete(ENDPOINTS.users.savedPlace(placeId));
  },
};

export default savedPlacesService;
