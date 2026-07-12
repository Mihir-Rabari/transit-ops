import prisma from '../config/db';

export async function checkExpiringLicenses() {
  console.log('[Background Service] Checking for expiring driver licenses...');
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expiringDrivers = await prisma.driver.findMany({
      where: {
        licenseExpiryDate: {
          gt: today,
          lte: thirtyDaysFromNow
        }
      }
    });

    console.log(`[Background Service] Found ${expiringDrivers.length} drivers with licenses expiring in the next 30 days.`);
    
    expiringDrivers.forEach((driver) => {
      const daysLeft = Math.ceil(
        (new Date(driver.licenseExpiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      console.log(`
========================================================================
[EMAIL SIMULATION] LICENSE EXPIRING SOON
To: safety-officer@transitops.com, ${driver.name.toLowerCase().replace(/\s+/g, '')}@transitops.com
Subject: Action Required: Driver License Expiring in ${daysLeft} Days - ${driver.name}

Dear TransitOps Safety Team & ${driver.name},

This is an automated alert notifying you that the driving license for driver
${driver.name} (License Number: ${driver.licenseNumber}, Class: ${driver.licenseCategory})
is set to expire on ${new Date(driver.licenseExpiryDate).toDateString()} (in ${daysLeft} days).

Please ensure a renewal is submitted and the system is updated before expiration to
prevent dispatch disruptions.

Contact Number: ${driver.contactNumber}
Current Safety Score: ${driver.safetyScore}/100

Sincerely,
TransitOps Automated Safety Agent
========================================================================
      `);
    });
  } catch (err) {
    console.error('[Background Service] Error running license check:', err);
  }
}

export function startLicenseExpiryCron() {
  // Run once immediately on startup
  checkExpiringLicenses();
  
  // Run every 24 hours (86400000 ms)
  setInterval(checkExpiringLicenses, 24 * 60 * 60 * 1000);
}
