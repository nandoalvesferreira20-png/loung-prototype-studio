// Official local assets shared by both layouts, their editors and all specialties.
export const clinicPhotos = [
  { name: "clinic-reception-hero", width: 1448, height: 1086 },
  { name: "doctor-consultation-main", width: 1122, height: 1402 },
  { name: "clinic-room-structure", width: 1448, height: 1086 },
  { name: "consultation-detail", width: 1122, height: 1402 },
] as const;

export const clinicPhotoNames = clinicPhotos.map((photo) => photo.name);

export function clinicDefaultPhoto(file: string) {
  const photo = clinicPhotos.find((candidate) => candidate.name === file);
  if (!photo) throw new Error("unknown_clinic_photo");
  return {
    src: `/templates/clinics/shared/${photo.name}.png`,
    width: photo.width,
    height: photo.height,
  };
}
