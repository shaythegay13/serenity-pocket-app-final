import { redirect } from 'next/navigation'

// PGSI assessment is now integrated into the Serenity Survey
// The serenity survey uses hybrid scoring to infer PGSI risk levels
export default function PGSIPage() {
  redirect('/serenity')
}
