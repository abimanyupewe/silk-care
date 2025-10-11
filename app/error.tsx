"use client"

import MaintenancePage from "@/components/shared/maintenence";


export default function Error() {
  return <MaintenancePage statusCode={404} />;
}