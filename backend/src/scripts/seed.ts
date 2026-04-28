import { db } from "../db/prisma.js";
import { STANDARD_PERMISSIONS, STANDARD_AMENITIES } from "../services/seedData.js";
import bcrypt from "bcrypt";

async function main() {
   const adminEmail = "monicah.tech@gmail.com";
  const existingAdmin = await db.user.findFirst({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("Admin@1234", 12);
    await db.user.create({
      data: {
        name: "Super Admin",
        email: adminEmail,
        username: "admin",
        password_hash: hashedPassword,
        phone: "+254700000000",
        plan: "FREE",
        firstLogin: false, 
      },
    });
    console.log(`✅ Default admin created — email: ${adminEmail} | password: Admin@1234`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }
  // Seed permissions
  const permissionCount = await db.permission.count();
  if (permissionCount === 0) {
    const permissionData = STANDARD_PERMISSIONS.map(p => ({
      key: p.key,
      label: p.label,
      category: p.category,
      group: p.group
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
      label: a.replace(/_/g, " "), 
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

  // Seed service categories
  const categoryCount = await db.serviceCategory.count();
  if (categoryCount === 0) {
    const categories = [
      { name: 'Cleaning', slug: 'cleaning', icon: '🧼', description: 'House cleaning and maintenance' },
      { name: 'Plumbing', slug: 'plumbing', icon: '🚿', description: 'Pipe repairs and installations' },
      { name: 'Movers', slug: 'movers', icon: '🚚', description: 'Furniture moving services' },
      { name: 'Electrician', slug: 'electrician', icon: '🔌', description: 'Electrical repairs and wiring' },
      { name: 'Painter', slug: 'painter', icon: '🎨', description: 'Interior and exterior painting' },
      { name: 'Locksmith', slug: 'locksmith', icon: '🔑', description: 'Lock installation and repairs' },
    ];

    await db.serviceCategory.createMany({
      data: categories,
    });
    console.log(`✅ Service categories inserted: ${categories.length}`);
  } else {
    console.log(`ℹ️ Service categories already exist: ${categoryCount}`);
  }

  // Seed sample service providers (2 per category)
  const providerCount = await db.serviceProvider.count();
  if (providerCount === 0) {
    const providers = [
      // Cleaning
      { name: 'CleanPro Services', phone: '+254712345678', email: 'cleanpro@example.com', categorySlug: 'cleaning', hourlyRate: 500, location: 'Nairobi CBD', rating: 4.8, bio: 'Professional cleaning for homes and offices' },
      { name: 'Sparkle Cleaners', phone: '+254723456789', email: 'sparkle@example.com', categorySlug: 'cleaning', hourlyRate: 450, location: 'Westlands', rating: 4.6, bio: 'Deep cleaning specialists' },

      // Plumbing
      { name: 'PipeFix Plumbing', phone: '+254734567890', email: 'pipefix@example.com', categorySlug: 'plumbing', hourlyRate: 800, location: 'Kilimani', rating: 4.9, bio: '24/7 emergency plumbing' },
      { name: 'Flow Masters', phone: '+254745678901', email: 'flow@example.com', categorySlug: 'plumbing', hourlyRate: 700, location: 'Lavington', rating: 4.7, bio: 'Water heater installation' },

      // Movers
      { name: 'Swift Movers Ltd', phone: '+254756789012', email: 'swift@example.com', categorySlug: 'movers', hourlyRate: 1200, location: 'Industrial Area', rating: 4.8, bio: 'Furniture and office relocation' },
      { name: 'EasyMove', phone: '+254767890123', email: 'easymove@example.com', categorySlug: 'movers', hourlyRate: 1000, location: 'Parklands', rating: 4.5, bio: 'Local moving services' },

      // Electrician
      { name: 'PowerTech Electric', phone: '+254778901234', email: 'powertech@example.com', categorySlug: 'electrician', hourlyRate: 900, location: 'Upper Hill', rating: 4.9, bio: 'Wiring and installations' },
      { name: 'Bright Sparks', phone: '+254789012345', email: 'bright@example.com', categorySlug: 'electrician', hourlyRate: 850, location: 'Kileleshwa', rating: 4.7, bio: 'Lighting specialists' },

      // Painter
      { name: 'ColorCraft Painters', phone: '+254790123456', email: 'colorcraft@example.com', categorySlug: 'painter', hourlyRate: 600, location: 'Nairobi West', rating: 4.6, bio: 'Interior and exterior painting' },
      { name: 'FreshCoat', phone: '+254701234567', email: 'freshcoat@example.com', categorySlug: 'painter', hourlyRate: 550, location: 'Runda', rating: 4.4, bio: 'Quality painting services' },

      // Locksmith
      { name: 'LockSafe Solutions', phone: '+254712345679', email: 'locksafe@example.com', categorySlug: 'locksmith', hourlyRate: 750, location: 'Westlands', rating: 5.0, bio: 'Emergency lockout service' },
      { name: 'KeyMasters', phone: '+254723456790', email: 'keymasters@example.com', categorySlug: 'locksmith', hourlyRate: 700, location: 'CBD', rating: 4.8, bio: 'Lock installation and repairs' },
    ];

    // Create categories first if needed, then providers
    for (const provider of providers) {
      const category = await db.serviceCategory.findUnique({
        where: { slug: provider.categorySlug },
      });
      if (!category) continue;

      await db.serviceProvider.create({
        data: {
          name: provider.name,
          phone: provider.phone,
          email: provider.email,
          categoryId: category.id,
          hourlyRate: provider.hourlyRate,
          location: provider.location,
          rating: provider.rating,
          bio: provider.bio,
        },
      });
    }
    console.log(`✅ Sample providers inserted: ${providers.length}`);
  } else {
    console.log(`ℹ️ Service providers already exist: ${providerCount}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });