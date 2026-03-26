import { db } from "../db/prisma.js";
import { STANDARD_PERMISSIONS, STANDARD_AMENITIES } from "../services/seedData.js";

async function main() {
  console.log("🌱 Seeding started...");

  // Seed permissions
  const permissionCount = await db.permission.count();
  if (permissionCount === 0) {
    const permissionData = STANDARD_PERMISSIONS.map(p => ({
      key: p.key,
      label: p.label,
      category: p.category
    }));

    await db.permission.createMany({
      data: permissionData,
      skipDuplicates: true
    });
    console.log(`✅ Permissions inserted: ${permissionData.length}`);
  } else {
    console.log(`ℹ️ Permissions already exist: ${permissionCount}`);
  }

  // Seed amenities
  const amenityCount = await db.amenity.count();
  if (amenityCount === 0) {
    const amenityData = STANDARD_AMENITIES.map(a => ({
      key: a,
      label: a.replace(/_/g, " "), // GYM -> GYM, SWIMMING_POOL -> SWIMMING POOL
      category: "AMENITY"
    }));

    await db.amenity.createMany({
      data: amenityData,
      skipDuplicates: true
    });
    console.log(`📦 Amenities inserted: ${amenityData.length}`);
  } else {
    console.log(`ℹ️ Amenities already exist: ${amenityCount}`);
  }

  // Total counts
  const totalPermissions = await db.permission.count();
  const totalAmenities = await db.amenity.count();
  console.log(`📊 Total permissions in DB: ${totalPermissions}`);
  console.log(`📊 Total amenities in DB: ${totalAmenities}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });