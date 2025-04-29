import UploadLeadsForm from './UploadLeadsForm'
import LeadsTable from './LeadsTable'

export default function LeadsSection() {
  return (
    <div className="space-y-6">
      <UploadLeadsForm />
      <LeadsTable />
    </div>
  )
}