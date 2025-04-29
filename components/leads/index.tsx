import UploadLeadsForm from './UploadLeadsForm'
import LeadsTable from './leadsTable'

export default function LeadsSection() {
  return (
    <div className="space-y-6">
      <UploadLeadsForm />
      <LeadsTable />
    </div>
  )
}