import type { Metadata } from 'next'
import { TravelerProfileForm } from '@/components/TravelerProfileForm'

export const metadata: Metadata = {
  title: 'Traveler Profile',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Traveler Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your travel preferences and contact information.
        </p>
      </div>

      <TravelerProfileForm />
    </div>
  )
}
